#!/usr/bin/env node
import {
    verifyTransporter,
    getJwtSecret,
} from "../src/lib/auth/server/authService.server.js";

const masked = (s) => {
    if (!s) return "(empty)";
    return `${s.length} chars, starts with '${s.slice(0, 3)}'`;
};

console.log("JWT_SECRET:", getJwtSecret ? getJwtSecret() : "(not available)");
console.log("EMAIL_PASSWORD env length:", masked(process.env.EMAIL_PASSWORD));
console.log("SENDER_EMAIL:", process.env.SENDER_EMAIL || "(not set)");

(async () => {
    try {
        const ok = await verifyTransporter();
        console.log("verifyTransporter result:", ok);
        process.exit(ok ? 0 : 2);
    } catch (err) {
        console.error("verifyTransporter threw:", err);
        process.exit(3);
    }
})();
