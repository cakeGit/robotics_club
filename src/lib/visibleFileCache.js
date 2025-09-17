import path from "path";
import fs from "fs/promises";

export class VisibleFileCache {
    constructor() {
        this.hiddenFiles = new Set();
        this.initialized = false;
        this.dataDir = path.join(process.cwd(), "data", "pages");
    }

    fileContentMarksHidden(content) {
        let trim = content.substring(0, 50).trim();
        trim = content.replace(/\r/g, "");
        return /^---\n(([a-z]+):[^\n]+\n)*hidden:( )*true/.test(trim);
    }

    initialize() {
        this.initialized = true;

        //Read all files and subdirectories, populate visibleFiles set

        const checkDirectory = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await checkDirectory(fullPath);
                } else if (entry.isFile() && entry.name.endsWith(".md")) {
                    try {
                        const content = await fs.readFile(fullPath, "utf-8");
                        if (this.fileContentMarksHidden(content)) {
                            this.hiddenFiles.add(
                                path.relative(this.dataDir, fullPath)
                            );
                            console.log(
                                `Marked initial hidden: ${path.relative(
                                    this.dataDir,
                                    fullPath
                                )}`
                            );
                        }
                    } catch (err) {
                        console.error(`Error reading ${fullPath}:`, err);
                    }
                }
            }
        };

        return checkDirectory(this.dataDir);
    }

    isFileVisible(filePath) {
        if (!this.initialized) {
            throw new Error(
                "VisibleFileCache not initialized. Call initialize() first."
            );
        }
        return !this.hiddenFiles.has(filePath);
    }

    refresh(path) {
        // Re-check a specific file to see if its visibility has changed
        const fullPath = path.join(this.dataDir, path);
        fs.readFile(fullPath, "utf-8")
            .then((content) => {
                if (this.fileContentMarksHidden(content)) {
                    this.hiddenFiles.add(fullPath);
                } else {
                    this.hiddenFiles.delete(fullPath);
                }
            })
            .catch((err) => {
                console.error(`Error reading ${fullPath} for validation:`, err);
            });
    }
}
