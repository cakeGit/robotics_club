// SERVER-SIDE AUTH SERVICE
// Node.js server-side authentication utilities
import "dotenv/config";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

// Generate a unique JWT secret if set to "generate"
let JWT_SECRET = process.env.JWT_SECRET;
// If JWT_SECRET is explicitly set to "generate", create a new one on startup.
if (JWT_SECRET === "generate") {
    JWT_SECRET = uuidv4();
    console.log("Generated new JWT secret on server start");
}

// If no JWT secret is provided, generate a temporary one for development
// to avoid jsonwebtoken throwing `secretOrPrivateKey must have a value`.
if (!JWT_SECRET) {
    JWT_SECRET = uuidv4();
    console.warn(
        "WARNING: No JWT_SECRET set in environment — using a temporary generated secret. Set process.env.JWT_SECRET in production to a persistent secret."
    );
}

// Parse the authorized emails from environment variable
const AUTHORIZED_EMAILS = (
    process.env.AUTHORIZED_EMAILS || "cakeistastydev@gmail.com"
)
    .split(",")
    .map((email) => email.trim());

// Default sender email (first in the list)
const SENDER_EMAIL = process.env.SENDER_EMAIL || AUTHORIZED_EMAILS[0];

// Default no-reply address used for outgoing verification emails. Allow override.
const NOREPLY_EMAIL =
    process.env.NOREPLY_EMAIL || "robotics-club-noreply@oreostack.uk";

/**
 * Generate a JWT token for a given email
 */
export const generateToken = (email) => {
    return jwt.sign({ email }, JWT_SECRET, { expiresIn: "24h" });
};

// Export getter for tests or other modules that may need to inspect the secret
export const getJwtSecret = () => JWT_SECRET;

/**
 * Verify a JWT token and return the email if valid
 */
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.email;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};

// Create a nodemailer transporter
// Normalize EMAIL_PASSWORD: remove accidental spaces (users often copy app passwords with spaces)
const EMAIL_PASSWORD = (process.env.EMAIL_PASSWORD || "").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: SENDER_EMAIL,
        pass: EMAIL_PASSWORD || "app_specific_password",
    },
});
// Verify transporter connectivity / auth
export const verifyTransporter = async () => {
    console.log("Email transporter verifying...");
    try {
        // nodemailer supports Promise when no callback is provided
        await transporter.verify();
        console.log("Email transporter verified");
        return true;
    } catch (err) {
        console.error("Email transporter verification failed:", err);
        return false;
    }
};

/**
 * Check if an email is authorized
 */
export const isAuthorizedEmail = (email) => {
    return AUTHORIZED_EMAILS.includes(email.trim().toLowerCase());
};

/**
 * Send verification email with JWT token
 */
export const sendVerificationEmail = async (email, token) => {
    // Check if the email is authorized
    if (!isAuthorizedEmail(email)) {
        throw new Error("Email not authorized to edit documentation");
    }

    // Create verification URL with token
    const baseUrl = process.env.APP_URL || "http://localhost:5173";
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const mailOptions = {
        from: NOREPLY_EMAIL,
        to: email,
        subject: "Robotics Club Docs - Verify your email",
        html: `
      <h1>Robotics Club Documentation</h1>
      <p>A request was received to sign into Robotics Club with your email. Click the link below to sign in and edit the documentation:</p>
      <p><a href="${verificationUrl}">Sign In to Edit</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this email, please ignore it, or start panicking.</p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send verification email");
    }
};
