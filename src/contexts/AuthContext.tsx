import { useState, useEffect, ReactNode, useCallback } from "react";
import { apiFetch, getToken, storeToken } from "@/lib/api";
import { AuthContext, type AuthUser } from "./auth-context";

interface SignResponse {
  user: AuthUser;
  token: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => getToken());

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const payload = await apiFetch<{ user: AuthUser }>("/auth/me");
      setUser(payload.user);
    } catch (error) {
      storeToken(null);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    refreshUser();
  }, [refreshUser]);

  const signUp = async (email: string, password: string, displayName?: string, role: "user" | "doctor" = "user") => {
    try {
      const payload = await apiFetch<SignResponse>("/auth/register", {
        method: "POST",
        body: { email, password, displayName, role },
        skipAuth: true,
      });
      storeToken(payload.token);
      setToken(payload.token);
      setUser(payload.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Registration failed" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const payload = await apiFetch<SignResponse>("/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });
      storeToken(payload.token);
      setToken(payload.token);
      setUser(payload.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Sign in failed" };
    }
  };

  const signOut = () => {
    storeToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
