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
