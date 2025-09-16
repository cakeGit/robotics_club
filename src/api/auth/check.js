import { verifyToken } from "../../lib/auth/server/authService.server.js";

export default function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    // Read cookie header
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("authToken="));
    if (!match) {
        return res.status(200).json({ authenticated: false });
    }

    const token = match.substring("authToken=".length);
    try {
        const email = verifyToken(token);
        return res.status(200).json({ authenticated: true, email });
    } catch (err) {
        return res.status(200).json({ authenticated: false });
    }
}
