import { handleSaveDocument } from "../../lib/api/apiHandlers";
import { verifyToken } from "../../lib/auth/server/authService.server";

export default async function handler(req, res) {
    if (req.method === "POST") {
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

            const { filePath, content } = req.body;

            if (!filePath || !content) {
                return res.status(400).json({
                    success: false,
                    message: "File path and content are required",
                });
            }

            const result = await handleSaveDocument(
                filePath,
                content,
                authToken
            );

            if (result.success) {
                res.status(200).json(result);
                console.log(
                    `${
                        new Date().toTimeString().split(" ")[0]
                    } Edited document: ${filePath}`
                );
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
