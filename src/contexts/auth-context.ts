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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
