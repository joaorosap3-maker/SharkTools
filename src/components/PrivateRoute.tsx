import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface Props {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager" | "user" | "client";
}

const roleHierarchy: Record<string, number> = {
  admin: 4,
  manager: 3,
  user: 2,
  client: 1,
};

export default function PrivateRoute({ children, requiredRole }: Props) {
  const { user, profile, loading } = useAuth();

  // Wait for auth to fully initialize before making any routing decisions.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No authenticated user → redirect to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control.
  if (requiredRole) {
    // If profile hasn't loaded yet (e.g. DB is slow), wait rather than
    // bouncing the user to login — profile will never be null for a valid
    // authenticated user once loading is false. If it genuinely is null
    // (profile row missing), fall back gracefully to the lowest role.
    const userRole = (profile?.role ?? "user") as keyof typeof roleHierarchy;
    const userLevel = roleHierarchy[userRole] ?? 0;
    const requiredLevel = roleHierarchy[requiredRole] ?? 0;

    if (userLevel < requiredLevel) {
      console.warn(
        `Access denied: required "${requiredRole}", user is "${userRole}"`
      );
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}