/**
 * Protected Route Component
 * Handles route protection based on authentication and role
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/services/auth.service';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: UserRole;
    redirectTo?: string;
}

export function ProtectedRoute({
    children,
    requiredRole,
    redirectTo,
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, role } = useAuth();
    const location = useLocation();

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        const defaultRedirect = requiredRole === 'admin' ? '/admin/login' : '/login';
        return <Navigate to={redirectTo || defaultRedirect} state={{ from: location }} replace />;
    }

    // Check role if required
    if (requiredRole && role !== requiredRole) {
        // Redirect to appropriate dashboard based on actual role
        if (role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (role === 'employee') {
            return <Navigate to="/employee/dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

/**
 * Admin Only Route
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
            {children}
        </ProtectedRoute>
    );
}

/**
 * Employee Only Route
 */
export function EmployeeRoute({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="employee" redirectTo="/login">
            {children}
        </ProtectedRoute>
    );
}

/**
 * Public Only Route (redirect authenticated users)
 */
interface PublicOnlyRouteProps {
    children: React.ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
    const { isAuthenticated, isLoading, role } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect authenticated users to their dashboard
    if (isAuthenticated) {
        if (role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (role === 'employee') {
            return <Navigate to="/employee/dashboard" replace />;
        }
    }

    return <>{children}</>;
}

export default ProtectedRoute;
