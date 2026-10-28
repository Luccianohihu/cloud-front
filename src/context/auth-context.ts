
import { createContext } from "react";

export interface User {
  id: string;
  username: string;
  email?: string;
}

export interface AuthContextType {
  token: string | null;
  role: string | null;
  user: User | null;
  isLoading: boolean;
  login: (returnTo?: string) => void;
  logout: () => void;
  saveTokenFromUrl: (rawHash?: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
