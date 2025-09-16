/**
 * Simple validation for email format
 */
export const validateEmailFormat = (email) => {
    return email && email.includes("@") && email.includes(".");
};

/**
 * Get JWT token from cookie
 */
export const getAuthCookie = () => {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith("authToken=")) {
            return cookie.substring("authToken=".length, cookie.length);
        }
    }
    return null;
};

/**
 * Check if user is authenticated (has auth cookie)
 */
export const isAuthenticated = () => {
    return !!getAuthCookie();
};

/**
 * Clear auth cookie (logout)
 */
export const clearAuthCookie = () => {
    document.cookie =
        "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
};

// Check auth by asking the server (allows HttpOnly cookies to be validated)
export const checkAuth = async () => {
    try {
        const res = await fetch("/api/auth/check", {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) return false;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            // Unexpected non-JSON response (likely HTML) — don't throw, just treat as unauthenticated
            const text = await res.text();
            console.warn(
                "checkAuth: expected JSON but got:",
                text.substring(0, 200)
            );
            return false;
        }

        const data = await res.json();
        return data && data.authenticated === true;
    } catch (err) {
        console.error("checkAuth failed", err);
        return false;
    }
};
