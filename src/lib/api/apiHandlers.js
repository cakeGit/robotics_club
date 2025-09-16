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
