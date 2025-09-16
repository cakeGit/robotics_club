import { handleRenameImage } from "../../lib/api/apiHandlers";
import { verifyToken } from "../../lib/auth/server/authService.server";

export default async function handler(req, res) {
    if (req.method === "PUT") {
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

            const { oldName, newName } = req.body;

            if (!oldName || !newName) {
                return res.status(400).json({
                    success: false,
                    message: "Old and new image names are required",
                });
            }

            const result = await handleRenameImage(oldName, newName, authToken);

            if (result.success) {
                console.log(
                    `${
                        new Date().toTimeString().split(" ")[0]
                    } Renamed image: ${oldName} to ${newName}`
                );
                return res.status(200).json(result);
            } else {
                if (result.code === "NOT_FOUND") {
                    return res.status(404).json(result);
                } else if (result.code === "DUPLICATE") {
                    return res.status(409).json(result);
                } else {
                    return res.status(400).json(result);
                }
            }
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }
    } else {
        return res.status(405).json({ message: "Method not allowed" });
    }
}
