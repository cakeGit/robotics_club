import { handleDeleteImage } from "../../lib/api/apiHandlers";
import { verifyToken } from "../../lib/auth/server/authService.server";

export default async function handler(req, res) {
    if (req.method === "DELETE") {
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

            const { imageName } = req.query;

            if (!imageName) {
                return res.status(400).json({
                    success: false,
                    message: "Image name is required",
                });
            }

            const result = await handleDeleteImage(imageName, authToken);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res
                    .status(result.code === "NOT_FOUND" ? 404 : 400)
                    .json(result);
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
