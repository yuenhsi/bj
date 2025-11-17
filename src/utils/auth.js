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

export const isAuthenticated = () => {
    return !!getStoredEmail();
};

