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
  const { user, profile, loading, profileLoading } = useAuth();

  // If the core session is loading, we show the full spinner
  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-slate-500 font-medium">Autenticando... (v1.0.2)</p>
        </div>
      </div>
    );
  }

  // If no user is present, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If we need a specific role, we MUST wait for the profile to load.
  // Otherwise, the user gets "Access Denied" because profile is null.
  if (requiredRole && profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <p className="text-sm text-slate-500">Verificando permissões... (v1.0.2)</p>
        </div>
      </div>
    );
  }

  if (requiredRole) {
    // If we have a user but no profile yet, we should technically wait if it's still being fetched,
    // but AuthProvider should have fetched it before setting loading to false.
    // However, if the profile is truly missing (not in DB), we default to "user".
    const userRole = (profile?.role ?? "user") as keyof typeof roleHierarchy;
    const userLevel = roleHierarchy[userRole] ?? 0;
    const requiredLevel = roleHierarchy[requiredRole] ?? 0;

    if (userLevel < requiredLevel) {
      console.warn(`Access denied: required ${requiredRole}, user is ${userRole}`);
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}