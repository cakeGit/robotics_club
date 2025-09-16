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
        // Custom plugin to handle API routes
        {
            name: "docs-api-plugin",
            configureServer(server) {
                // Ensure data directories exist
                ensureDataDirs().catch((err) => {
                    console.error("Failed to ensure data directories:", err);
                });

                // Handle API routes
                server.middlewares.use((req, res, next) => {
                    // Page index endpoint
                    if (req.method === "GET" && req.url === "/api/page_index") {
                        handlePageIndex(req, res);
                        return;
                    }

                    // Page content endpoint
                    if (
                        req.method === "GET" &&
                        req.url.startsWith("/api/page/")
                    ) {
                        handlePageContent(req, res);
                        return;
                    }

                    // Email verification endpoints
                    if (req.url === "/api/auth/send-verification-email") {
                        import("./src/api/handlers.js")
                            .then(({ handleSendVerificationEmailApi }) => {
                                handleSendVerificationEmailApi(req, res);
                            })
                            .catch((error) => {
                                console.error(
                                    "Error handling verification email:",
                                    error
                                );
                                res.writeHead(500, {
                                    "Content-Type": "application/json",
                                });
                                res.end(
                                    JSON.stringify({
                                        success: false,
                                        message: "Server error",
                                    })
                                );
                            });
                        return;
                    }

                    if (req.url.startsWith("/api/auth/verify-email")) {
                        import("./src/api/handlers.js")
                            .then(({ handleVerifyEmailApi }) => {
                                handleVerifyEmailApi(req, res);
                            })
                            .catch((error) => {
                                console.error(
                                    "Error handling email verification:",
                                    error
                                );
                                res.writeHead(500, {
                                    "Content-Type": "application/json",
                                });
                                res.end(
                                    JSON.stringify({
                                        success: false,
                                        message: "Server error",
                                    })
                                );
                            });
                        return;
                    }

                    // Not an API route, continue
                    next();
                });
            },
        },
        react(),
    ],
});

// Handler for page index API
async function handlePageIndex(req, res) {
    console.log("API: Processing page index request");
    try {
        const pagesDir = path.join(__dirname, "data", "pages");

        // Ensure directory exists
        if (!(await fs.pathExists(pagesDir))) {
            await fs.ensureDir(pagesDir);
        }

        const tree = await createDirectoryTree(pagesDir);
        console.log("API: Generated file tree");

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
        });
        res.end(JSON.stringify(tree));
    } catch (error) {
        console.error("API: Error getting page index:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                error: "Failed to get page index",
                message: error.message,
            })
        );
    }
}

// Handler for page content API
async function handlePageContent(req, res) {
    try {
        const pagePath = req.url.substring("/api/page/".length);
        console.log("API: Processing page content request:", pagePath);

        const fullPath = path.join(__dirname, "data", "pages", pagePath);
        console.log("API: Looking for file:", fullPath);

        if (!(await fs.pathExists(fullPath))) {
            console.log("API: File not found:", fullPath);
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(
                JSON.stringify({
                    error: "Page not found",
                    path: pagePath,
                })
            );
        }

        if (!(await fs.stat(fullPath)).isFile()) {
            console.log("API: Not a file:", fullPath);
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
                JSON.stringify({
                    error: "Not a file",
                    path: pagePath,
                })
            );
        }

        const content = await fs.readFile(fullPath, "utf-8");
        console.log("API: Read file content, length:", content.length);

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
        });
        res.end(JSON.stringify({ content }));
    } catch (error) {
        console.error("API: Error getting page content:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                error: "Failed to get page content",
                message: error.message,
            })
        );
    }
}
