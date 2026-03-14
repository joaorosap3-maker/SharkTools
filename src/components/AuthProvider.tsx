import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { logAuditEvent } from "../security/auditLogger";

interface AuthContextProps {
    user: any | null;
    profile: any | null;
    loading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (error) {
                console.error("Profile fetch error:", error);
                return null;
            }

            setProfile(data ?? null);
            return data ?? null;
        } catch (err) {
            console.error("Unexpected profile error:", err);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                const currentUser = data.session?.user ?? null;

                if (!mounted) return;

                setUser(currentUser);

                if (currentUser) {
                    await fetchProfile(currentUser.id);
                }

            } catch (err) {
                console.error("Auth init error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;

            setUser(currentUser);

            if (currentUser) {
                const loadedProfile = await fetchProfile(currentUser.id);

                if (event === "SIGNED_IN" && loadedProfile) {
                    await logAuditEvent({
                        action: "login_success",
                        company_id: loadedProfile.company_id,
                        severity: "info",
                    });
                }
            } else {
                if (event === "SIGNED_OUT" && profile) {
                    await logAuditEvent({
                        action: "logout",
                        company_id: profile.company_id,
                        severity: "info",
                    });
                }

                setProfile(null);
            }

            setLoading(false);
        });

        return () => {
            mounted = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    const isAdmin = profile?.role === "admin";

    return (
        <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);