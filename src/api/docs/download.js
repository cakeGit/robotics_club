import path from "path";
import fs from "fs";
import os from "os";
import archiver from "archiver";
import { pipeline } from "stream/promises";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.writeHead(405, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Method not allowed" }));
    }

    const root = process.cwd();
    const pagesDir = path.join(root, "data", "pages");
    const imagesDir = path.join(root, "data", "images");

    // Create a temp file to write the archive into, then stream it to the client
    const tmpFile = path.join(os.tmpdir(), `robotics_club_${Date.now()}.zip`);

    try {
        const output = fs.createWriteStream(tmpFile);
        const archive = archiver("zip", { zlib: { level: 9 } });

        archive.on("error", (err) => {
            console.error("Archive error:", err);
            try {
                output.destroy();
            } catch (e) {}
        });

        archive.pipe(output);

        if (fs.existsSync(pagesDir)) {
            archive.directory(pagesDir, "pages");
        }

        if (fs.existsSync(imagesDir)) {
            archive.directory(imagesDir, "images");
        }

        await archive.finalize();

        // Wait for the output stream to finish writing the file
        await new Promise((resolve, reject) => {
            output.on("close", resolve);
            output.on("end", resolve);
            output.on("error", reject);
        });

        const stat = await fs.promises.stat(tmpFile);

        // Set headers and stream the file to the response
        res.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Disposition":
                'attachment; filename="robotics_club_content.zip"',
            "Content-Length": String(stat.size),
        });

        const readStream = fs.createReadStream(tmpFile);

        // Ensure the temp file is removed after streaming
        readStream.on("close", async () => {
            try {
                await fs.promises.unlink(tmpFile);
            } catch (e) {
                // ignore
            }
        });

        readStream.on("error", async (err) => {
            console.error("Read stream error:", err);
            try {
                await fs.promises.unlink(tmpFile);
            } catch (e) {}
        });

        // Pipe to response
        await pipeline(readStream, res);
    } catch (err) {
        console.error("Failed to create or send zip:", err);
        try {
            // Clean up if temp file exists
            if (fs.existsSync(tmpFile)) {
                await fs.promises.unlink(tmpFile);
            }
        } catch (e) {}

        if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Failed to create zip" }));
        } else {
            try {
                res.end();
            } catch (e) {}
        }
    }
}
