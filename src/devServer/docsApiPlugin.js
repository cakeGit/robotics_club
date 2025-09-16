import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// Project root and data directory
const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "data", "pages");
// Get __dirname equivalent in ES module (kept for backwards compatibility)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`Initialized docs api, dataDir=${dataDir}`);

// Helper function to create a directory structure from filesystem
const createDirectoryTree = async (dirPath) => {
    try {
        if (!(await fs.pathExists(dirPath))) {
            await fs.ensureDir(dirPath);
            return [];
        }

        const items = await fs.readdir(dirPath);
        const result = [];

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);

            if (stats.isDirectory()) {
                const children = await createDirectoryTree(itemPath);
                result.push({ name: item, type: "directory", children });
            } else if (stats.isFile() && item.endsWith(".md")) {
                const relativePath = itemPath
                    .replace(dataDir, "")
                    .replace(/\\/g, "/");
                result.push({ name: item, type: "file", path: relativePath });
            }
        }

        return result;
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return [];
    }
};

// Adapter to provide Express-like `req` and `res` objects for handlers
function createExpressLike(nodeReq, nodeRes) {
    const url = new URL(nodeReq.url, `http://${nodeReq.headers.host}`);
    const req = {
        url: nodeReq.url,
        method: nodeReq.method,
        headers: nodeReq.headers,
        cookies: (nodeReq.headers.cookie || "")
            .split(";")
            .map((c) => c.trim())
            .filter(Boolean)
            .reduce((acc, cur) => {
                const [k, ...v] = cur.split("=");
                acc[k] = decodeURIComponent(v.join("="));
                return acc;
            }, {}),
        query: Object.fromEntries(
            new URL(
                nodeReq.url,
                `http://${nodeReq.headers.host}`
            ).searchParams.entries()
        ),
        raw: nodeReq, // Expose raw request if needed
    };

    // Minimal res helpers used by our handlers
    const res = {
        status: (code) => {
            nodeRes.statusCode = code;
            return res;
        },
        json: (data) => {
            nodeRes.setHeader("Content-Type", "application/json");
            nodeRes.end(JSON.stringify(data));
        },
        setHeader: (name, value) => nodeRes.setHeader(name, value),
        end: (data) => nodeRes.end(data),
    };

    // Body parser for JSON
    let bodyText = "";
    const parseBody = async () => {
        const contentType = nodeReq.headers["content-type"] || "";
        if (
            nodeReq.method !== "GET" &&
            nodeReq.method !== "HEAD" &&
            !contentType.startsWith("multipart/form-data")
        ) {
            const buffers = [];
            for await (const chunk of nodeReq) {
                buffers.push(chunk);
            }
            bodyText = Buffer.concat(buffers).toString();
        }
        try {
            return JSON.parse(bodyText || "{}");
        } catch (e) {
            return {};
        }
    };

    return {
        req,
        res,
        parseBody,
        get body() {
            try {
                return JSON.parse(bodyText || "{}");
            } catch (e) {
                return {};
            }
        },
    };
}

// Create data directory if it doesn't exist
const ensureDataDirs = async () => {
    const pagesDir = dataDir;
    await fs.ensureDir(pagesDir);

    // Ensure images directory exists
    const imagesDir = path.join(process.cwd(), "data", "images");
    await fs.ensureDir(imagesDir);

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

// Handler for page index API
async function handlePageIndex(req, res) {
    try {
        // Use the project data directory (resolved at module top) so paths
        // are consistent with the rest of the plugin and the repo layout.
        const pagesDir = dataDir;
        if (!(await fs.pathExists(pagesDir))) {
            // Ensure the pages directory exists (creates sample files when empty)
            await ensureDataDirs();
        }

        const tree = await createDirectoryTree(dataDir);
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
        const pagePath = req.url.split("?")[0].substring("/api/page/".length);
        const fullPath = path.join(dataDir, pagePath);

        if (!(await fs.pathExists(fullPath))) {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(
                JSON.stringify({ error: "Page not found", path: pagePath })
            );
        }

        if (!(await fs.stat(fullPath)).isFile()) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
                JSON.stringify({ error: "Not a file", path: pagePath })
            );
        }

        const content = await fs.readFile(fullPath, "utf-8");
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

export function setupDocsApiRoutes(server) {
    // Ensure data directories exist
    ensureDataDirs().catch((err) => {
        console.error("Failed to ensure data directories:", err);
    });

    server.middlewares.use((req, res, next) => {
        // Normalize URL (strip query string) to make matching robust
        const normalizedUrl = req.url.split("?")[0];

        // Page index endpoint
        if (req.method === "GET" && normalizedUrl === "/api/page_index") {
            handlePageIndex(req, res);
            return;
        }

        // Page content endpoint
        if (req.method === "GET" && normalizedUrl.startsWith("/api/page/")) {
            handlePageContent(req, res);
            return;
        }

        // Email verification endpoints
        if (normalizedUrl === "/api/auth/send-verification-email") {
            import("../../src/api/handlers.js")
                .then(({ handleSendVerificationEmailApi }) => {
                    handleSendVerificationEmailApi(req, res);
                })
                .catch((error) => {
                    console.error("Error handling verification email:", error);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Server error",
                        })
                    );
                });
            return;
        }

        if (normalizedUrl.startsWith("/api/auth/verify-email")) {
            import("../../src/api/handlers.js")
                .then(({ handleVerifyEmailApi }) => {
                    handleVerifyEmailApi(req, res);
                })
                .catch((error) => {
                    console.error("Error handling email verification:", error);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Server error",
                        })
                    );
                });
            return;
        }

        // Auth check endpoint (dev server route)
        if (normalizedUrl === "/api/auth/check") {
            import("../../src/api/handlers.js")
                .then(({ handleCheckAuthApi }) => {
                    handleCheckAuthApi(req, res);
                })
                .catch((error) => {
                    console.error("Error handling auth check:", error);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ authenticated: false }));
                });
            return;
        }

        // Docs API endpoints used by the client
        if (normalizedUrl.startsWith("/api/docs/get")) {
            (async () => {
                try {
                    const { default: handler } = await import(
                        "../../src/api/docs/get.js"
                    );

                    // Create Express-like req/res for the handler
                    const adapter = createExpressLike(req, res);
                    // No body to parse for GET, but ensure query/cookies are attached
                    await handler(adapter.req, adapter.res);
                } catch (err) {
                    console.error("Error in /api/docs/get handler", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Server error",
                        })
                    );
                }
            })();
            return;
        }

        if (
            normalizedUrl === "/api/docs/list" ||
            normalizedUrl.startsWith("/api/docs/list")
        ) {
            (async () => {
                try {
                    const { default: handler } = await import(
                        "../../src/api/docs/list.js"
                    );
                    const adapter = createExpressLike(req, res);
                    await handler(adapter.req, adapter.res);
                } catch (err) {
                    console.error("Error in /api/docs/list handler", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Server error",
                        })
                    );
                }
            })();
            return;
        }

        if (normalizedUrl === "/api/docs/save") {
            (async () => {
                try {
                    const { default: handler } = await import(
                        "../../src/api/docs/save.js"
                    );
                    const adapter = createExpressLike(req, res);
                    // For POST, parse body so handler can access req.body
                    await adapter.parseBody();
                    adapter.req.body = adapter.body;
                    await handler(adapter.req, adapter.res);
                } catch (err) {
                    console.error("Error in /api/docs/save handler", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Server error",
                        })
                    );
                }
            })();
            return;
        }

        if (normalizedUrl === "/api/docs/delete") {
            (async () => {
                try {
                    const { default: handler } = await import(
                        "../../src/api/docs/delete.js"
                    );
                    const adapter = createExpressLike(req, res);
                    await adapter.parseBody();
                    adapter.req.body = adapter.body;
                    await handler(adapter.req, adapter.res);
                } catch (err) {
                    console.error("Error in /api/docs/delete handler", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Server error",
                        })
                    );
                }
            })();
            return;
        }

        if (normalizedUrl === "/api/docs/download") {
            (async () => {
                try {
                    const { default: handler } = await import(
                        "../../src/api/docs/download.js"
                    );
                    // download handler uses raw req/res streaming; call directly
                    await handler(req, res);
                } catch (err) {
                    console.error("Error in /api/docs/download handler", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Server error",
                        })
                    );
                }
            })();
            return;
        }

        // Handle image API routes
        if (normalizedUrl === "/api/images/list") {
            (async () => {
                try {
                    const { handleListImages } = await import(
                        "../../src/lib/api/apiHandlers.js"
                    );
                    const result = await handleListImages();
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(result));
                } catch (err) {
                    console.error("Error handling images list", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Error listing images: " + err.message,
                        })
                    );
                }
            })();
            return;
        }

        if (normalizedUrl === "/api/images/upload") {
            (async () => {
                try {
                    const { default: handler } = await import(
                        "../../src/api/images/upload.js"
                    );
                    const adapter = createExpressLike(req, res);
                    adapter.req.cookies = adapter.req.cookies || {};
                    await handler(adapter.req, adapter.res);
                } catch (err) {
                    console.error("Error handling image upload", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Error uploading image: " + err.message,
                        })
                    );
                }
            })();
            return;
        }

        if (normalizedUrl === "/api/images/delete") {
            (async () => {
                try {
                    const { default: handler } = await import(
                        "../../src/api/images/delete.js"
                    );
                    const adapter = createExpressLike(req, res);
                    adapter.req.cookies = adapter.req.cookies || {};
                    await handler(adapter.req, adapter.res);
                } catch (err) {
                    console.error("Error handling image delete", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Error deleting image: " + err.message,
                        })
                    );
                }
            })();
            return;
        }

        if (normalizedUrl === "/api/images/rename") {
            (async () => {
                try {
                    const { default: handler } = await import(
                        "../../src/api/images/rename.js"
                    );
                    const adapter = createExpressLike(req, res);
                    await adapter.parseBody();
                    adapter.req.body = adapter.body;
                    adapter.req.cookies = adapter.req.cookies || {};
                    await handler(adapter.req, adapter.res);
                } catch (err) {
                    console.error("Error handling image rename", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            message: "Error renaming image: " + err.message,
                        })
                    );
                }
            })();
            return;
        }

        // Not an API route, continue to next middleware
        next();
    });
}
