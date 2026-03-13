// src/components/AuthProvider.tsx
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
    isAdmin: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data && !error) {
                setProfile(data);
                return data;
            }
            return null;
        } catch (err) {
            console.error("Error fetching profile:", err);
            return null;
        }
    };

    useEffect(() => {
        // Checa sessão atual
        supabase.auth.getSession().then(({ data }) => {
            const currentUser = data.session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchProfile(currentUser.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Listener de mudança de autenticação
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            if (currentUser) {
                const loadedProfile = await fetchProfile(currentUser.id);
                
                if (event === 'SIGNED_IN' && loadedProfile) {
                    await logAuditEvent({
                        action: 'login_success',
                        company_id: loadedProfile.company_id,
                        severity: 'info'
                    });
                }
            } else {
                if (event === 'SIGNED_OUT' && profile) {
                    await logAuditEvent({
                        action: 'logout',
                        company_id: profile.company_id,
                        severity: 'info'
                    });
                }
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const isAdmin = profile?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);