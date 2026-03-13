import { useState, useEffect, ReactNode, useCallback } from "react";
import { apiFetch, getToken, storeToken } from "@/lib/api";
import { AuthContext, type AuthUser } from "./auth-context";

interface SignResponse {
  user: AuthUser;
  token: string;
  two_factor_required?: boolean;
  challenge_id?: string;
  debug_code?: string;
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
      if (payload.two_factor_required) {
        return {
          error: null,
          twoFactorRequired: true,
          challengeId: payload.challenge_id || null,
          debugCode: payload.debug_code || null,
        };
      }
      storeToken(payload.token);
      setToken(payload.token);
      setUser(payload.user);
      return { error: null, twoFactorRequired: false, challengeId: null, debugCode: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Sign in failed", twoFactorRequired: false, challengeId: null, debugCode: null };
    }
  };

  const verifyTwoFactor = async (challengeId: string, code: string) => {
    try {
      const payload = await apiFetch<SignResponse>("/auth/2fa/verify-login", {
        method: "POST",
        body: { challenge_id: challengeId, code },
        skipAuth: true,
      });
      storeToken(payload.token);
      setToken(payload.token);
      setUser(payload.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "2FA verification failed" };
    }
  };

  const requestTwoFactorEnable = async () => {
    try {
      const payload = await apiFetch<{ data: { challenge_id: string; debug_code?: string } }>("/auth/2fa/request-enable", {
        method: "POST",
        body: {},
      });
      return {
        error: null,
        challengeId: payload.data?.challenge_id || null,
        debugCode: payload.data?.debug_code || null,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to request 2FA code", challengeId: null, debugCode: null };
    }
  };

  const confirmTwoFactorEnable = async (challengeId: string, code: string) => {
    try {
      const payload = await apiFetch<{ user: AuthUser }>("/auth/2fa/confirm-enable", {
        method: "POST",
        body: { challenge_id: challengeId, code },
      });
      setUser(payload.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to enable 2FA" };
    }
  };

  const disableTwoFactor = async () => {
    try {
      const payload = await apiFetch<{ user: AuthUser }>("/auth/2fa/disable", {
        method: "POST",
        body: {},
      });
      setUser(payload.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to disable 2FA" };
    }
  };

  const signOut = () => {
    storeToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, verifyTwoFactor, requestTwoFactorEnable, confirmTwoFactorEnable, disableTwoFactor, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
