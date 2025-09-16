// API handler for email verification requests
import {
    generateToken,
    sendVerificationEmail,
    isAuthorizedEmail,
    verifyToken,
} from "../lib/auth/server/authService.server.js";

// Handle sending verification emails
export async function handleSendVerificationEmailApi(req, res) {
    try {
        // Parse the request body for JSON requests
        let email;

        // For POST requests with JSON body
        if (req.method === "POST") {
            // Read the request body as a stream
            const buffers = [];
            for await (const chunk of req) {
                buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();

            try {
                const body = JSON.parse(data);
                email = body.email;
            } catch (e) {
                console.error("Failed to parse JSON body:", e);
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(
                    JSON.stringify({
                        success: false,
                        message: "Invalid request body",
                    })
                );
            }
        }

        if (!email) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
                JSON.stringify({
                    success: false,
                    message: "Email is required",
                })
            );
        }

        // Check if the email is authorized
        if (!isAuthorizedEmail(email)) {
            res.writeHead(403, { "Content-Type": "application/json" });
            return res.end(
                JSON.stringify({
                    success: false,
                    message:
                        "This email is not authorized to edit documentation",
                })
            );
        }

        // Generate token and send email
        const token = generateToken(email);
        await sendVerificationEmail(email, token);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                success: true,
                message: "Verification email sent successfully",
            })
        );
    } catch (error) {
        console.error("Error in send verification email API:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                success: false,
                message: error.message || "Failed to send verification email",
            })
        );
    }
}

// Handle email verification
export function handleVerifyEmailApi(req, res) {
    try {
        // Extract token from query string
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(
                JSON.stringify({
                    success: false,
                    message: "Token is required",
                })
            );
        }

        // Verify the token
        const email = verifyToken(token);

        // Set the authentication cookie
        const cookieOptions = [
            `authToken=${token}`,
            "Path=/",
            "HttpOnly",
            "Secure",
            "SameSite=Strict",
            `Max-Age=${60 * 60 * 24}`, // 24 hours
        ];

        res.setHeader("Set-Cookie", cookieOptions.join("; "));

        // Return success response
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                success: true,
                message: "Email verified successfully",
                email,
            })
        );
    } catch (error) {
        console.error("Error in verify email API:", error);
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                success: false,
                message: error.message || "Invalid or expired token",
            })
        );
    }
}
