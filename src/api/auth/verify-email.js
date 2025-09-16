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
            // Determine cookie attributes: during local development allow client-side access
            const isLocalhost =
                req.headers.host && req.headers.host.includes("localhost");
            const maxAge = 60 * 60 * 24; // 24 hours in seconds

            // If running on localhost, omit HttpOnly and Secure so client-side JS can read the cookie
            // In production, keep HttpOnly and Secure for safety
            const cookieAttributes = isLocalhost
                ? `Path=/; SameSite=Strict; Max-Age=${maxAge}`
                : `Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

            res.setHeader(
                "Set-Cookie",
                `authToken=${result.token}; ${cookieAttributes}`
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
