import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);
