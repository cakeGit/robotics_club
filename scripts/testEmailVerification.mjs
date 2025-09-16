// Test script for email verification API
// Run this with: node scripts/testEmailVerification.mjs

import fetch from "node-fetch";

async function testEmailVerificationAPI() {
    console.log("Testing email verification API endpoints...");

    // Test send verification email endpoint
    console.log("\nTesting /api/auth/send-verification-email endpoint:");
    try {
        const response = await fetch(
            "http://localhost:5173/api/auth/send-verification-email",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: "cakeistastydev@gmail.com", // Use an authorized email from your .env
                }),
            }
        );

        const data = await response.json();
        console.log("Response:", data);

        if (response.ok) {
            console.log("✅ Email verification request successful!");
        } else {
            console.log("❌ Email verification request failed!");
        }
    } catch (error) {
        console.error("Error testing email verification API:", error);
    }
}

testEmailVerificationAPI();
