import { useAuth } from "../components/AuthProvider";

/**
 * useRBAC.ts — Hook for Role-Based Access Control.
 * Helps check permissions easily in components.
 */

export type AppRole = 'admin' | 'user' | 'manager' | 'client';

export const useRBAC = () => {
    const { user, profile, loading } = useAuth();

    const role = (profile?.role as AppRole) || 'user';
    const isAdmin = role === 'admin';
    const isManager = role === 'manager' || isAdmin;
    
    /**
     * Check if user has a specific role or higher.
     */
    const hasRole = (requiredRole: AppRole) => {
        if (loading || !user) return false;
        
        const roleHierarchy: Record<AppRole, number> = {
            admin: 4,
            manager: 3,
            user: 2,
            client: 1
        };

        return roleHierarchy[role] >= roleHierarchy[requiredRole];
    };

    /**
     * Check permissions for specific app areas.
     */
    const canAccess = (area: string) => {
        if (!user) return false;
        
        switch (area) {
            case 'users':
            case 'settings':
            case 'audit_logs':
                return isAdmin;
            case 'financial':
            case 'reports':
                return isManager;
            default:
                return true; // Generic areas are open to all authenticated users
        }
    };

    return {
        role,
        isAdmin,
        isManager,
        hasRole,
        canAccess,
        profile,
        loading
    };
};
