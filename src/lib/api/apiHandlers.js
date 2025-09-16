import {
    generateToken,
    sendVerificationEmail,
    verifyToken,
    isAuthorizedEmail,
} from "../auth/server/authService.server";
import fs from "fs/promises";
import path from "path";

// Send verification email
export const handleSendVerificationEmail = async (email) => {
    try {
        if (!email) {
            throw new Error("Email address is required");
        }

        const token = generateToken(email);
        await sendVerificationEmail(email, token);
        return {
            success: true,
            message: "Verification email sent successfully",
        };
    } catch (error) {
        console.error("Error sending verification email:", error);
        return {
            success: false,
            message: error.message || "Failed to send verification email",
        };
    }
};

// Verify email token
export const handleVerifyEmail = (token) => {
    try {
        const email = verifyToken(token);
        return { success: true, email, token };
    } catch (error) {
        return {
            success: false,
            message: error.message || "Invalid or expired token",
        };
    }
};

// Get the absolute path to the data directory
const getDataDirectory = () => {
    return path.join(process.cwd(), "data", "pages");
};

// Get the absolute path to the images directory
export const getImagesDirectory = () => {
    return path.join(process.cwd(), "data", "images");
};

// Validate and resolve file path
const resolveDocPath = (filePath) => {
    // Make sure the filePath is relative to data/pages
    if (filePath.startsWith("/")) {
        filePath = filePath.slice(1);
    }

    // If filePath doesn't explicitly contain data/pages, add it
    if (!filePath.startsWith("data/pages")) {
        filePath = path.join("data/pages", filePath);
    }

    // Resolve the absolute path
    const absPath = path.resolve(process.cwd(), filePath);
    const dataDir = getDataDirectory();

    // Security check: Make sure the path is within the data directory
    if (!absPath.startsWith(dataDir)) {
        throw new Error("Invalid file path: Path is outside of data directory");
    }

    return absPath;
};

// Save document changes
export const handleSaveDocument = async (filePath, content, token) => {
    try {
        // Verify authentication
        verifyToken(token);

        // Validate and resolve the file path
        const absPath = resolveDocPath(filePath);

        // Ensure the directory exists
        const dirPath = path.dirname(absPath);
        await fs.mkdir(dirPath, { recursive: true });

        // Write the content to the file
        await fs.writeFile(absPath, content, "utf8");

        console.log(`Document saved successfully: ${absPath}`);
        return {
            success: true,
            message: "Document saved successfully",
            path: absPath,
        };
    } catch (error) {
        console.error("Error saving document:", error);
        return {
            success: false,
            message: error.message || "Failed to save document",
        };
    }
};

// Get document content
export const handleGetDocument = async (filePath) => {
    try {
        // Validate and resolve the file path
        const absPath = resolveDocPath(filePath);

        console.log(`Reading document: ${absPath}`);

        // Read the file content
        const content = await fs.readFile(absPath, "utf8");

        return { success: true, content, path: absPath };
    } catch (error) {
        console.error("Error reading document:", error);

        // If the file doesn't exist, return a more specific error message
        if (error.code === "ENOENT") {
            return {
                success: false,
                message: "Document not found",
                code: "NOT_FOUND",
                path: filePath,
            };
        }

        return {
            success: false,
            message: error.message || "Failed to read document",
            path: filePath,
        };
    }
};

// List all documents in the data directory
export const handleListDocuments = async () => {
    try {
        const dataDir = getDataDirectory();

        // Function to recursively list all markdown files
        const listMarkdownFiles = async (dir, baseDir = "") => {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            const files = await Promise.all(
                entries.map(async (entry) => {
                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.join(baseDir, entry.name);

                    if (entry.isDirectory()) {
                        return await listMarkdownFiles(fullPath, relativePath);
                    } else if (entry.name.endsWith(".md")) {
                        return relativePath;
                    } else {
                        return null;
                    }
                })
            );

            // Flatten the array and remove nulls
            return files.flat().filter((file) => file !== null);
        };

        const files = await listMarkdownFiles(dataDir);

        return { success: true, files };
    } catch (error) {
        console.error("Error listing documents:", error);
        return {
            success: false,
            message: error.message || "Failed to list documents",
        };
    }
};

// Delete document
export const handleDeleteDocument = async (filePath, token) => {
    try {
        // Verify authentication
        verifyToken(token);

        const absPath = resolveDocPath(filePath);

        // Delete the file
        await fs.unlink(absPath);

        // Delete hanging directories if empty
        let currentDir = path.dirname(absPath);
        const dataDir = getDataDirectory();
        while (currentDir.startsWith(dataDir)) {
            const files = await fs.readdir(currentDir);
            if (files.length === 0) {
                await fs.rmdir(currentDir);
                currentDir = path.dirname(currentDir);
            } else {
                break;
            }
        }

        return { success: true, message: "Document deleted", path: absPath };
    } catch (error) {
        console.error("Error deleting document:", error);
        if (error.code === "ENOENT") {
            return {
                success: false,
                message: "Document not found",
                code: "NOT_FOUND",
                path: filePath,
            };
        }
        return {
            success: false,
            message: error.message || "Failed to delete document",
            path: filePath,
        };
    }
};

// List all images in the images directory
export const handleListImages = async () => {
    try {
        const imagesDir = getImagesDirectory();

        // Create the directory if it doesn't exist
        await fs.mkdir(imagesDir, { recursive: true });

        const entries = await fs.readdir(imagesDir, { withFileTypes: true });

        const images = await Promise.all(
            entries.map(async (entry) => {
                // Make sure we're only processing files, not directories
                if (entry.isFile()) {
                    try {
                        const filePath = path.join(imagesDir, entry.name);
                        const stats = await fs.stat(filePath);

                        // Get file extension
                        const ext = path.extname(entry.name).toLowerCase();
                        const isImage = [
                            ".jpg",
                            ".jpeg",
                            ".png",
                            ".gif",
                            ".svg",
                            ".webp",
                        ].includes(ext);

                        if (isImage) {
                            // Encode the filename to handle special characters
                            const encodedName = encodeURIComponent(entry.name);
                            return {
                                name: entry.name,
                                path: `/data/images/${encodedName}`,
                                size: stats.size,
                                lastModified: stats.mtime,
                            };
                        }
                    } catch (err) {
                        console.error(
                            `Error processing file ${entry.name}:`,
                            err
                        );
                        return null;
                    }
                }
                return null;
            })
        );

        return {
            success: true,
            images: images.filter((img) => img !== null),
        };
    } catch (error) {
        console.error("Error listing images:", error);
        return {
            success: false,
            message: error.message || "Failed to list images",
        };
    }
};

// Delete image
export const handleDeleteImage = async (imageName, token) => {
    try {
        // Verify authentication
        verifyToken(token);

        const imagesDir = getImagesDirectory();
        const filePath = path.join(imagesDir, path.basename(imageName));

        // Check if the file exists
        try {
            await fs.access(filePath);
        } catch (e) {
            return {
                success: false,
                message: "Image not found",
                code: "NOT_FOUND",
            };
        }

        // Delete the file
        await fs.unlink(filePath);

        return {
            success: true,
            message: "Image deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting image:", error);
        return {
            success: false,
            message: error.message || "Failed to delete image",
        };
    }
};

// Rename image
export const handleRenameImage = async (oldName, newName, token) => {
    try {
        // Verify authentication
        verifyToken(token);

        const imagesDir = getImagesDirectory();
        const oldPath = path.join(imagesDir, path.basename(oldName));
        const newPath = path.join(imagesDir, path.basename(newName));

        // Check if the source file exists
        try {
            await fs.access(oldPath);
        } catch (e) {
            return {
                success: false,
                message: "Source image not found",
                code: "NOT_FOUND",
            };
        }

        // Check if the destination file already exists
        try {
            await fs.access(newPath);
            return {
                success: false,
                message: "A file with the new name already exists",
                code: "DUPLICATE",
            };
        } catch (e) {
            // This is expected if the file doesn't exist
        }

        // Rename the file
        await fs.rename(oldPath, newPath);

        return {
            success: true,
            message: "Image renamed successfully",
            newPath: `/data/images/${path.basename(newName)}`,
        };
    } catch (error) {
        console.error("Error renaming image:", error);
        return {
            success: false,
            message: error.message || "Failed to rename image",
        };
    }
};
