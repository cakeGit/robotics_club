import { handleDeleteDocument } from "../../lib/api/apiHandlers";
import { verifyToken } from "../../lib/auth/server/authService.server";

export default async function handler(req, res) {
    if (req.method === "POST") {
        const authToken = req.cookies?.authToken;

        if (!authToken) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        try {
            verifyToken(authToken);

            const { filePath } = req.body;

            if (!filePath) {
                return res
                    .status(400)
                    .json({ success: false, message: "File path required" });
            }

            const result = await handleDeleteDocument(filePath, authToken);

            if (result.success) {
                return res.status(200).json(result);
            }

            return res.status(400).json(result);
        } catch (err) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid authentication" });
        }
    }

    res.status(405).json({ message: "Method not allowed" });
}
