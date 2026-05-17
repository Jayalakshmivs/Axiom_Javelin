import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/services/api";

interface User {
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    /** Returns null on success, or an error message string on failure. */
    login: (email: string, password: string) => Promise<string | null>;
    /** Returns null on success, or an error message string on failure. */
    signup: (email: string, password: string, name: string) => Promise<string | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("axiom_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem("axiom_user");
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<string | null> => {
        try {
            const response = await authApi.login({ email, password });
            const userData: User = response.data.user;
            setUser(userData);
            localStorage.setItem("axiom_user", JSON.stringify(userData));
            return null; // success
        } catch (error: any) {
            console.error("LOGIN ERROR:", error?.response?.data ?? error?.message ?? error);
            const detail = error?.response?.data?.detail;
            if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail);
            if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
                return "Request timed out. Make sure the backend server is running on port 8000.";
            }
            if (error?.code === 'ERR_NETWORK' || !error?.response) {
                return "Cannot connect to server. Make sure the backend is running on port 8000.";
            }
            return "Login failed. Please check your credentials.";
        }
    };

    const signup = async (email: string, password: string, name: string): Promise<string | null> => {
        try {
            console.log("Attempting SIGNUP → POST /api/auth/signup");
            const response = await authApi.signup({ name, email, password });
            const userData: User = response.data.user;
            setUser(userData);
            localStorage.setItem("axiom_user", JSON.stringify(userData));
            return null; // success
        } catch (error: any) {
            console.error("SIGNUP ERROR:", error?.response?.data ?? error?.message ?? error);

            // Backend returned a structured error (400 duplicate email, 422 validation, etc.)
            const detail = error?.response?.data?.detail;
            if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail);

            // Axios network error (backend down, timeout, CORS)
            if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
                return "Request timed out. Make sure the backend server is running on port 8000.";
            }
            if (error?.code === 'ERR_NETWORK' || !error?.response) {
                return "Cannot connect to server. Make sure the backend is running on port 8000.";
            }

            // Generic fallback
            return "Registration failed. Please check your connection or use a different email.";
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("axiom_user");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
