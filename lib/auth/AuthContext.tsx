"use client";

import {
  createContext, useContext, useEffect,
  useState, useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Session, AuthChangeEvent} from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "customer" | "business_owner" | "admin";
  created_at: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  city: string | null;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  business: null,
  loading: true,
  refreshProfile: async () => {},
  refreshBusiness: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
    return data;
  }, []);

  const fetchBusiness = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("businesses")
      .select("id, name, slug, category, logo_url, cover_image_url, is_verified, rating, total_reviews, city")
      .eq("owner_id", userId)
      .maybeSingle();
    setBusiness(data as Business | null);
    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const refreshBusiness = useCallback(async () => {
    if (user?.id) await fetchBusiness(user.id);
  }, [user, fetchBusiness]);

  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const profileData = await fetchProfile(session.user.id);
        if (profileData?.role === "business_owner") {
          await fetchBusiness(session.user.id);
        }
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          if ((profileData as any)?.role === "business_owner") {
            await fetchBusiness(session.user.id);
          }
        } else {
          setProfile(null);
          setBusiness(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchBusiness]);

  return (
    <AuthContext.Provider value={{
      user, profile, business, loading,
      refreshProfile, refreshBusiness,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}