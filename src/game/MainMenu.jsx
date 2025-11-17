import { useState, useEffect } from "react";
import "./MainMenu.scss";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import {
    getStoredEmail,
    clearAuthData,
    getDecodedToken,
} from "../utils/auth.js";

const MainMenu = () => {
    const [userEmail, setUserEmail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initialize email from localStorage on mount
    useEffect(() => {
        const storedEmail = getStoredEmail();
        if (storedEmail) {
            setUserEmail(storedEmail);
        }
    }, []);

    const handleDailyRun = () => {
        // No operation
    };

    const handlePracticeCount = () => {
        // No operation
    };

    const handleHighScore = () => {
        // No operation
    };

    const handleGoogleLoginSuccess = (credentialResponse) => {
        setIsLoading(true);
        setError(null);
        try {
            const email = getDecodedToken(credentialResponse).email;
            if (!email) {
                throw new Error("Email not found in user data");
            }
            // Store email and token in localStorage
            storeAuthData(email, idToken);
            setUserEmail(email);
        } catch (err) {
            console.error("Error processing Google login:", err);
            setError("Failed to process login. Please try again.");
            // Clear any partial auth data
            clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLoginError = () => {
        console.error("Google login error");
        setError("Login failed. Please try again.");
        setIsLoading(false);
    };

    const handleLogout = () => {
        clearAuthData();
        setUserEmail(null);
        setError(null);
        googleLogout();
    };

    return (
        <div className="main-menu-container">
            {error && (
                <div className="auth-error-message">
                    {error}
                    <button
                        className="error-dismiss"
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}
            {userEmail ? (
                <div className="user-auth-display">
                    <span className="user-email">{userEmail}</span>
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        disabled={isLoading}
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <div className="google-sign-in-container">
                    <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginError}
                        theme="outline"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                    />
                </div>
            )}
            <div className="main-menu-content">
                <h1 className="main-menu-title">Blackjack</h1>
                <div className="main-menu-buttons">
                    <button
                        className={`menu-btn daily-run-btn ${
                            !userEmail ? "disabled-btn" : ""
                        }`}
                        onClick={handleDailyRun}
                        disabled={!userEmail}
                    >
                        Daily Run
                        {!userEmail && (
                            <span className="sign-in-tooltip">
                                Sign in to play
                            </span>
                        )}
                    </button>
                    <button
                        className={`menu-btn practice-count-btn ${
                            !userEmail ? "disabled-btn" : ""
                        }`}
                        onClick={handlePracticeCount}
                        disabled={!userEmail}
                    >
                        Practice Count
                        {!userEmail && (
                            <span className="sign-in-tooltip">
                                Sign in to play
                            </span>
                        )}
                    </button>
                    <button
                        className={`menu-btn high-score-btn ${
                            !userEmail ? "disabled-btn" : ""
                        }`}
                        onClick={handleHighScore}
                        disabled={!userEmail}
                    >
                        High Score
                        {!userEmail && (
                            <span className="sign-in-tooltip">
                                Sign in to play
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainMenu;
