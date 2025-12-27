/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, type AuthUser, type UserRole } from '@/services/auth.service';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    role: UserRole;
    loginAdmin: (email: string, password: string) => Promise<void>;
    loginEmployee: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const authUser = await authService.getAuthUser();
            setUser(authUser);
        } catch {
            setUser(null);
        }
    }, []);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            try {
                await refreshUser();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [refreshUser]);

    const loginAdmin = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const authUser = await authService.loginAdmin(email, password);
            setUser(authUser);
        } finally {
            setIsLoading(false);
        }
    };

    const loginEmployee = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const authUser = await authService.loginEmployee(email, password);
            setUser(authUser);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role || null,
        loginAdmin,
        loginEmployee,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
