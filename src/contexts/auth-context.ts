import { createContext } from "react";
export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  roles: Array<"user" | "doctor" | "admin" | "moderator">;
  user_metadata: {
    display_name: string;
  };
  app_metadata: {
    provider: string;
    roles: string[];
  };
  created_at: string;
  doctor_application_status?: "pending" | "approved" | "rejected" | null;
  doctor_verified?: boolean;
  two_factor_enabled?: boolean;
};

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
    role?: "user" | "doctor",
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{
    error: string | null;
    twoFactorRequired?: boolean;
    challengeId?: string | null;
    debugCode?: string | null;
  }>;
  verifyTwoFactor: (challengeId: string, code: string) => Promise<{ error: string | null }>;
  requestTwoFactorEnable: () => Promise<{ error: string | null; challengeId?: string | null; debugCode?: string | null }>;
  confirmTwoFactorEnable: (challengeId: string, code: string) => Promise<{ error: string | null }>;
  disableTwoFactor: () => Promise<{ error: string | null }>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
