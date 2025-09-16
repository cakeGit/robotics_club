import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { setupDocsApiRoutes } from "./src/devServer/docsApiPlugin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const imagesDir = path.join(process.cwd(), "data", "images");

// Serve images under /data/images
app.use("/data/images", express.static(imagesDir));

const distDir = path.join(process.cwd(), "dist");

// Serve static files
app.use(express.static(distDir));

// Adapter for plugin
const adapterServer = {
    middlewares: {
        use: (...args) => app.use(...args),
    },
};

// Mount docs API routes BEFORE fallback
setupDocsApiRoutes(adapterServer);

// SPA fallback (only if not API/data)
app.get(/.*/, (req, res) => {
    const indexPath = path.join(distDir, "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Not found");
    }
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
    console.log(`Production server listening on ${port}`)
);

server.on("error", (err) => {
    console.error("Server error:", err);
});

server.on("close", () => {
    console.warn("Server closed");
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled rejection:", reason);
});

// Graceful shutdown handling
process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down server...");
    server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down server...");
    server.close(() => process.exit(0));
});
