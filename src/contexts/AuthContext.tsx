import { useState, useEffect, ReactNode, useCallback } from "react";
import { apiFetch, getToken, storeToken } from "@/lib/api";
import { AuthContext, type AuthUser } from "./auth-context";
import type { RegistrationProfileInput } from "./auth-context";

interface SignResponse {
  user?: AuthUser;
  token?: string;
  two_factor_required?: boolean;
  email_verification_required?: boolean;
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

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
    role: "user" | "doctor" = "user",
    profile?: RegistrationProfileInput,
  ) => {
    try {
      const payload = await apiFetch<SignResponse>("/auth/register", {
        method: "POST",
        body: { email, password, displayName, role, profile },
        skipAuth: true,
      });
      if (payload.email_verification_required) {
        return {
          error: null,
          emailVerificationRequired: true,
          challengeId: payload.challenge_id || null,
          debugCode: payload.debug_code || null,
        };
      }
      if (payload.user && payload.token) {
        storeToken(payload.token);
        setToken(payload.token);
        setUser(payload.user);
        return { error: null };
      }
      return { error: "Registration response is invalid" };
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
          emailVerificationRequired: false,
          challengeId: payload.challenge_id || null,
          debugCode: payload.debug_code || null,
        };
      }
      if (payload.email_verification_required) {
        return {
          error: null,
          twoFactorRequired: false,
          emailVerificationRequired: true,
          challengeId: payload.challenge_id || null,
          debugCode: payload.debug_code || null,
        };
      }
      if (payload.user && payload.token) {
        storeToken(payload.token);
        setToken(payload.token);
        setUser(payload.user);
        return { error: null, twoFactorRequired: false, emailVerificationRequired: false, challengeId: null, debugCode: null };
      }
      return { error: "Login response is invalid", twoFactorRequired: false, emailVerificationRequired: false, challengeId: null, debugCode: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Sign in failed", twoFactorRequired: false, emailVerificationRequired: false, challengeId: null, debugCode: null };
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    try {
      const payload = await apiFetch<SignResponse>("/auth/google", {
        method: "POST",
        body: { id_token: idToken },
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
      if (!payload.user || !payload.token) {
        return { error: "Google sign in response is invalid", twoFactorRequired: false, challengeId: null, debugCode: null };
      }
      storeToken(payload.token);
      setToken(payload.token);
      setUser(payload.user);
      return { error: null, twoFactorRequired: false, challengeId: null, debugCode: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Google sign in failed", twoFactorRequired: false, challengeId: null, debugCode: null };
    }
  };

  const verifyTwoFactor = async (challengeId: string, code: string) => {
    try {
      const payload = await apiFetch<SignResponse>("/auth/2fa/verify-login", {
        method: "POST",
        body: { challenge_id: challengeId, code },
        skipAuth: true,
      });
      if (!payload.user || !payload.token) {
        return { error: "2FA verification response is invalid" };
      }
      storeToken(payload.token);
      setToken(payload.token);
      setUser(payload.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "2FA verification failed" };
    }
  };

  const resendTwoFactorLoginCode = async (challengeId: string) => {
    try {
      const payload = await apiFetch<{ debug_code?: string }>("/auth/2fa/resend-login", {
        method: "POST",
        body: { challenge_id: challengeId },
        skipAuth: true,
      });
      return { error: null, debugCode: payload.debug_code || null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to resend 2FA code", debugCode: null };
    }
  };

  const verifyEmailVerificationCode = async (
    code: string,
    options?: { challengeId?: string | null; email?: string | null },
  ) => {
    try {
      const payload = await apiFetch<SignResponse>("/auth/email-verification/verify", {
        method: "POST",
        body: {
          challenge_id: options?.challengeId || undefined,
          email: options?.email || undefined,
          code,
        },
        skipAuth: true,
      });
      if (!payload.user || !payload.token) {
        return { error: "Verification response is invalid" };
      }
      storeToken(payload.token);
      setToken(payload.token);
      setUser(payload.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Email verification failed" };
    }
  };

  const resendEmailVerificationCode = async (options?: { challengeId?: string | null; email?: string | null }) => {
    try {
      const payload = await apiFetch<{ challenge_id?: string; debug_code?: string }>("/auth/email-verification/resend", {
        method: "POST",
        body: {
          challenge_id: options?.challengeId || undefined,
          email: options?.email || undefined,
        },
        skipAuth: true,
      });
      return {
        error: null,
        challengeId: payload.challenge_id || null,
        debugCode: payload.debug_code || null,
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Failed to resend verification code", challengeId: null, debugCode: null };
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
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, verifyTwoFactor, resendTwoFactorLoginCode, verifyEmailVerificationCode, resendEmailVerificationCode, requestTwoFactorEnable, confirmTwoFactorEnable, disableTwoFactor, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
