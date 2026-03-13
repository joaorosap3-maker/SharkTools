import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface Props {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'user' | 'manager' | 'client';
}

export default function PrivateRoute({ children, requiredRole }: Props) {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role-based protection
    if (requiredRole && profile) {
        const roleHierarchy = { admin: 4, manager: 3, user: 2, client: 1 };
        const userRole = (profile.role || 'user') as keyof typeof roleHierarchy;
        
        if (roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
            console.warn(`Access denied: required ${requiredRole}, user is ${userRole}`);
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
}