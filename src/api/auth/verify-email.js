import { handleVerifyEmail } from "../../lib/api/apiHandlers";

export default function handler(req, res) {
    if (req.method === "GET") {
        const { token } = req.query;

        if (!token) {
            return res
                .status(400)
                .json({ success: false, message: "Token is required" });
        }

        const result = handleVerifyEmail(token);

        if (result.success) {
            // Set the JWT token as an HTTP-only cookie
            res.setHeader(
                "Set-Cookie",
                `authToken=${
                    result.token
                }; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${
                    60 * 60 * 24
                }`
            );

            // Return success status with email
            res.status(200).json({
                success: true,
                message: "Email verified successfully",
                email: result.email,
            });
        } else {
            res.status(400).json(result);
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
