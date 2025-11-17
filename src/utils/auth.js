// Auth utility functions for localStorage operations

const STORAGE_KEYS = {
    USER_EMAIL: "user_email",
    ACCESS_TOKEN: "google_access_token",
};

export const storeAuthData = (email, accessToken) => {
    try {
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    } catch (error) {
        console.error("Error storing auth data:", error);
    }
};

export const getStoredEmail = () => {
    try {
        return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    } catch (error) {
        console.error("Error getting stored email:", error);
        return null;
    }
};

export const getStoredToken = () => {
    try {
        return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
        console.error("Error getting stored token:", error);
        return null;
    }
};

export const clearAuthData = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
        console.error("Error clearing auth data:", error);
    }
};

export const getDecodedToken = (credentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
        throw new Error("No credential received");
    }

    // Decode JWT (base64url decode the payload)
    const base64Url = idToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
    );
    const decodedToken = JSON.parse(jsonPayload);
    return decodedToken;
};

export const isAuthenticated = () => {
    return !!getStoredEmail();
};
