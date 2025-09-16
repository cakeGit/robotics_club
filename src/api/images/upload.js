import { verifyToken } from "../../lib/auth/server/authService.server.js";
import fs from "fs";
import path from "path";
import formidable from "formidable";
import { getImagesDirectory } from "../../lib/api/apiHandlers.js";

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    // Check for authentication token
    const authToken = req.cookies?.authToken;

    if (!authToken) {
        return res
            .status(401)
            .json({ success: false, message: "Authentication required" });
    }

    try {
        // Verify token
        verifyToken(authToken);

        // Get the images directory
        const imagesDir = getImagesDirectory();

        // Create the directory if it doesn't exist
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        const form = formidable({
            maxFileSize: 10 * 1024 * 1024, // 10MB limit
            keepExtensions: true,
            uploadDir: imagesDir,
        });

        form.parse(req.raw || req, async (err, fields, files) => {
            if (err) {
                console.error("Error parsing form:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error uploading file",
                });
            }

            try {
                const uploadedFile = files.image && files.image[0];

                if (!uploadedFile) {
                    return res.status(400).json({
                        success: false,
                        message: "No image file provided",
                    });
                }

                // Extract file information
                const originalFilename = uploadedFile.originalFilename;
                const tempPath = uploadedFile.filepath;

                // Generate a safe filename
                const ext = path.extname(originalFilename).toLowerCase();

                // Validate file type
                const validExtensions = [
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".gif",
                    ".svg",
                    ".webp",
                ];
                if (!validExtensions.includes(ext)) {
                    // Remove the temporary file
                    fs.unlinkSync(tempPath);

                    return res.status(400).json({
                        success: false,
                        message: "Invalid file type. Only images are allowed.",
                    });
                }

                // Clean and sanitize the filename to avoid special characters
                let filename = path
                    .basename(originalFilename)
                    .replace(/[#?&]/g, "_") // Replace URL-problematic characters
                    .replace(/\s+/g, "_"); // Replace spaces with underscores
                const targetPath = path.join(imagesDir, filename);

                // If the file already exists, append a timestamp to make unique
                let finalFilename = filename;
                let finalPath = targetPath;

                if (fs.existsSync(targetPath)) {
                    const timestamp = new Date().getTime();
                    const filenameBase = path.basename(filename, ext);
                    finalFilename = `${filenameBase}_${timestamp}${ext}`;
                    finalPath = path.join(imagesDir, finalFilename);
                }

                // Move the file to its final destination
                fs.renameSync(tempPath, finalPath);

                console.log(
                    `${
                        new Date().toTimeString().split(" ")[0]
                    } Uploaded new image: ${finalFilename}`
                );

                return res.status(200).json({
                    success: true,
                    message: "Image uploaded successfully",
                    image: {
                        name: finalFilename,
                        path: `/data/images/${finalFilename}`,
                        size: fs.statSync(finalPath).size,
                        lastModified: fs.statSync(finalPath).mtime,
                    },
                });
            } catch (error) {
                console.error("Error handling uploaded file:", error);
                return res.status(500).json({
                    success: false,
                    message: "Error processing uploaded file",
                });
            }
        });
    } catch (error) {
        console.error("Error uploading image:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid authentication token",
        });
    }
}
