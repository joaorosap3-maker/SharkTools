import React from "react";
import { useRBAC, AppRole } from "../hooks/useRBAC";

/**
 * RBACGuard.tsx — Component wrapper for conditional rendering based on role.
 * Example: <RBACGuard requiredRole="admin">Only admins see this</RBACGuard>
 */

interface RBACGuardProps {
    requiredRole?: AppRole;
    area?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const RBACGuard: React.FC<RBACGuardProps> = ({ 
    requiredRole, 
    area, 
    children, 
    fallback = null 
}) => {
    const { hasRole, canAccess, loading } = useRBAC();

    if (loading) return null;

    let allowed = true;

    if (requiredRole) {
        allowed = hasRole(requiredRole);
    }

    if (allowed && area) {
        allowed = canAccess(area);
    }

    if (!allowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default RBACGuard;
