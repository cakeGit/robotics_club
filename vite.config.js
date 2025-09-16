import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper function to create a directory structure from filesystem
const createDirectoryTree = async (dirPath) => {
    try {
        console.log(`Creating directory tree for: ${dirPath}`);

        // Check if directory exists
        if (!(await fs.pathExists(dirPath))) {
            console.log(`Directory does not exist: ${dirPath}, creating it`);
            await fs.ensureDir(dirPath);
            return [];
        }

        const items = await fs.readdir(dirPath);
        console.log(`Found ${items.length} items in directory: ${dirPath}`);

        const result = [];

        for (const item of items) {
            const itemPath = path.join(dirPath, item);

            try {
                const stats = await fs.stat(itemPath);

                if (stats.isDirectory()) {
                    console.log(`Processing directory: ${item}`);
                    const children = await createDirectoryTree(itemPath);
                    result.push({
                        name: item,
                        type: "directory",
                        children,
                    });
                } else if (stats.isFile() && item.endsWith(".md")) {
                    // Only include markdown files
                    console.log(`Found markdown file: ${item}`);
                    const relativePath = itemPath
                        .replace(path.join(__dirname, "data", "pages"), "")
                        .replace(/\\/g, "/");

                    result.push({
                        name: item,
                        type: "file",
                        path: relativePath,
                    });
                }
            } catch (itemError) {
                console.error(`Error processing item ${itemPath}:`, itemError);
                // Continue with other items even if one fails
            }
        }

        return result;
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return [];
    }
};

// Create data directory if it doesn't exist
const ensureDataDirs = async () => {
    const pagesDir = path.join(__dirname, "data", "pages");
    await fs.ensureDir(pagesDir);

    // Ensure images directory exists
    const imagesDir = path.join(__dirname, "data", "images");
    await fs.ensureDir(imagesDir);

    // Create a sample markdown file if the directory is empty
    const files = await fs.readdir(pagesDir);
    if (files.length === 0) {
        await fs.writeFile(
            path.join(pagesDir, "index.md"),
            "# Welcome to Robotics Club Documentation\n\nThis is a sample documentation page.\n\n## Getting Started\n\nClick on pages in the sidebar to navigate the documentation.\n"
        );
        await fs.ensureDir(path.join(pagesDir, "tutorials"));
        await fs.writeFile(
            path.join(pagesDir, "tutorials", "first-steps.md"),
            "# First Steps\n\nLearn how to get started with our robotics projects.\n\n## Prerequisites\n\n- Basic programming knowledge\n- A computer with internet access\n\n## Setup\n\n1. Install required software\n2. Clone the repository\n3. Run the examples\n"
        );
    }
};

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        // Custom plugin to handle API routes (moved to src/devServer/docsApiPlugin.js)
        {
            name: "docs-api-plugin",
            async configureServer(server) {
                try {
                    // Create images directory if it doesn't exist
                    const imagesDir = path.join(__dirname, "data", "images");
                    await fs.ensureDir(imagesDir);

                    // Serve static files from data directory
                    server.middlewares.use("/data", (req, res, next) => {
                        const urlPath = decodeURIComponent(req.url);
                        // Only serve from the images subdirectory
                        if (urlPath.startsWith("/images/")) {
                            try {
                                const fileName = path.basename(urlPath);
                                const filePath = path.join(
                                    __dirname,
                                    "data",
                                    "images",
                                    fileName
                                );

                                // Check if file exists before attempting to read it
                                if (
                                    fs.existsSync(filePath) &&
                                    fs.statSync(filePath).isFile()
                                ) {
                                    // Set appropriate content type based on file extension
                                    const ext = path
                                        .extname(fileName)
                                        .toLowerCase();
                                    const contentTypes = {
                                        ".jpg": "image/jpeg",
                                        ".jpeg": "image/jpeg",
                                        ".png": "image/png",
                                        ".gif": "image/gif",
                                        ".svg": "image/svg+xml",
                                        ".webp": "image/webp",
                                    };

                                    if (contentTypes[ext]) {
                                        res.setHeader(
                                            "Content-Type",
                                            contentTypes[ext]
                                        );
                                    }

                                    const fileStream =
                                        fs.createReadStream(filePath);
                                    fileStream.on("error", (err) => {
                                        console.error(
                                            `Error reading file ${filePath}:`,
                                            err
                                        );
                                        res.statusCode = 500;
                                        res.end("Error reading file");
                                    });
                                    fileStream.pipe(res);
                                    return;
                                }
                            } catch (err) {
                                console.error(
                                    `Error serving file from ${urlPath}:`,
                                    err
                                );
                            }
                        }
                        next();
                    });

                    const mod = await import(
                        "./src/devServer/docsApiPlugin.js"
                    );
                    if (mod && typeof mod.setupDocsApiRoutes === "function") {
                        mod.setupDocsApiRoutes(server);
                    } else {
                        console.error(
                            "docs-api-plugin: setupDocsApiRoutes not found in module"
                        );
                    }
                } catch (err) {
                    console.error("Failed to setup docs API routes:", err);
                }
            },
        },
        react(),
    ],
});
