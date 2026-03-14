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
  profileLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  profile: null,
  loading: true,
  profileLoading: false,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Track the last userId we fetched a profile for to prevent redundant calls.
  const fetchedForUserId = useRef<string | null>(null);
  // Track in-flight profile fetch to avoid concurrent duplicates.
  const fetchingRef = useRef(false);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (fetchedForUserId.current === userId || fetchingRef.current) {
      return profile;
    }

    console.log(`[Auth] Fetching profile for ${userId}...`);
    fetchingRef.current = true;
    setProfileLoading(true);

    // Create a timeout promise to race against the query
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    try {
      const queryPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      // If we got here, it's not a timeout
      const { data, error } = result as any;

      if (error) {
        console.error("[Auth] Profile fetch error:", error);
        return null;
      }

      const fetched = data ?? null;
      console.log("[Auth] Profile received:", fetched?.role || "no-role");
      fetchedForUserId.current = userId;
      setProfile(fetched);
      return fetched;
    } catch (err: any) {
      if (err.message === "Timeout") {
        console.warn("[Auth] Profile fetch TIMED OUT (5s). Using fallback.");
      } else {
        console.error("[Auth] Unexpected profile error:", err);
      }
      return null;
    } finally {
      fetchingRef.current = false;
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const VERSION = "v1.0.2";
    console.log(`[Auth] Initializing Provider ${VERSION}`);

    // Session fallback
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[Auth] Session initialization timed out. Forcing loading false.");
        setLoading(false);
      }
    }, 8000);

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        console.log(`[Auth] Event: ${event} ${VERSION}`, { userId: currentUser?.id });

        setUser(currentUser);

        // ALWAYS resolve session loading as soon as we have an event
        if (mounted) {
          setLoading(false);
          clearTimeout(loadingTimeout);
        }

        if (currentUser) {
          // Fetch profile in the background — don't await here to avoid blocking and loops
          fetchProfile(currentUser.id).then(loadedProfile => {
            if (event === "SIGNED_IN" && loadedProfile) {
              logAuditEvent({
                action: "login_success",
                company_id: loadedProfile.company_id,
                severity: "info",
              });
            }
          });
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          fetchedForUserId.current = null;
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);