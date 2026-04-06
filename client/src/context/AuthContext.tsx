import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { MeResponse } from "@shared/types";

interface AuthState {
  user: MeResponse | null;
  token: string | null;
  loading: boolean;
  login: (email: string) => Promise<{ success: boolean; message: string }>;
  /** Option A: Returning user instant login — email only, no magic link */
  loginWithEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  /** Option B: Direct signup — creates account, authenticates, grants trial */
  signup: (params: {
    email: string;
    name?: string;
    faithTradition?: string;
    onboardingConcern?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data: MeResponse = await res.json();
        setUser(data);
        setToken(accessToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        fetchMe(session.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (magic link verification in other tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.access_token) {
          await fetchMe(session.access_token);
        } else {
          setUser(null);
          setToken(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [fetchMe]);

  const login = useCallback(async (email: string) => {
    const res = await fetch("/api/v1/auth/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, message: data.message || "Something went wrong" };
    }
    return { success: true, message: data.message };
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || "Login failed" };
      }

      // Use token hash to establish a real Supabase session
      if (supabase) {
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.tokenHash,
          type: "magiclink",
        });
        if (otpError || !otpData.session) {
          return { success: false, message: "Could not establish session" };
        }
        await fetchMe(otpData.session.access_token);
      }

      return { success: true, message: "Welcome back!" };
    } catch (err) {
      console.error("Login failed:", err);
      return { success: false, message: "Something went wrong" };
    }
  }, [fetchMe]);

  const signup = useCallback(async (params: {
    email: string;
    name?: string;
    faithTradition?: string;
    onboardingConcern?: string;
  }) => {
    try {
      // 1. Call server to create account + get token hash
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || "Signup failed" };
      }

      // 2. Use token hash to establish a real Supabase session
      if (supabase) {
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.tokenHash,
          type: "magiclink",
        });
        if (otpError || !otpData.session) {
          return { success: false, message: "Could not establish session" };
        }
        // 3. Fetch user profile with the new session token
        await fetchMe(otpData.session.access_token);
      }

      return { success: true, message: "Account created" };
    } catch (err) {
      console.error("Signup failed:", err);
      return { success: false, message: "Something went wrong" };
    }
  }, [fetchMe]);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) {
      await fetchMe(token);
    }
  }, [token, fetchMe]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithEmail, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
