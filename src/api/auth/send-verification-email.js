import { handleSendVerificationEmail } from "../../lib/api/apiHandlers";
import { isAuthorizedEmail } from "../../lib/auth/authService";

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { email } = req.body || {};

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required",
            });
        }

        // Check if the email is authorized
        if (!isAuthorizedEmail(email)) {
            return res.status(403).json({
                success: false,
                message: "This email is not authorized to edit documentation",
            });
        }

        const result = await handleSendVerificationEmail(email);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
