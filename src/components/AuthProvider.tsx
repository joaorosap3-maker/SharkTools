import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";
import { logAuditEvent } from "../security/auditLogger";

interface Profile {
  id: string;
  role?: string;
  company_id?: string;
  full_name?: string;
  [key: string]: unknown;
}

interface AuthContextProps {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Track the last userId we fetched a profile for to prevent redundant calls.
  const fetchedForUserId = useRef<string | null>(null);
  // Track in-flight profile fetch to avoid concurrent duplicates.
  const fetchingRef = useRef(false);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    // Skip if we already have the profile for this user or a fetch is in flight.
    if (fetchedForUserId.current === userId || fetchingRef.current) {
      return profile;
    }

    fetchingRef.current = true;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        // maybeSingle() returns null (not 406) when row is absent.
        // A real error here is unexpected — log and continue gracefully.
        console.error("Profile fetch error:", error);
        return null;
      }

      const fetched = data ?? null;
      fetchedForUserId.current = userId;
      setProfile(fetched);
      return fetched;
    } catch (err) {
      console.error("Unexpected profile error:", err);
      return null;
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        console.log("Auth initialized:", { event: "INITIAL_CHECK", userId: currentUser?.id });
        
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

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        console.log("Auth event:", event, { userId: currentUser?.id });

        if (event === "INITIAL_SESSION") {
          setUser(currentUser);
          if (currentUser) {
            await fetchProfile(currentUser.id);
          }
          if (mounted) setLoading(false);
          return;
        }

        if (event === "SIGNED_IN") {
          setUser(currentUser);
          if (currentUser) {
            fetchedForUserId.current = null;
            const loadedProfile = await fetchProfile(currentUser.id);
            if (loadedProfile) {
              await logAuditEvent({
                action: "login_success",
                company_id: loadedProfile.company_id,
                severity: "info",
              });
            }
          }
          if (mounted) setLoading(false);
          return;
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile((prev) => {
            if (prev?.company_id) {
              logAuditEvent({
                action: "logout",
                company_id: prev.company_id,
                severity: "info",
              });
            }
            return null;
          });
          fetchedForUserId.current = null;
          if (mounted) setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          setUser(currentUser);
          return;
        }
      }
    );

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