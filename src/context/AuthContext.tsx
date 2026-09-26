// src/context/AuthContext.tsx
import React, { createContext, useCallback, useContext, useState } from "react";

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;

export interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  token: string | null;
  role: string | null;
  user: User | null;
  login: () => void;
  logout: () => void;
  saveTokenFromUrl: (rawHash?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const parseJwt = (tokenStr: string) => {
    try {
      const base64Url = tokenStr.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error al parsear el JWT:", e);
      return null;
    }
  };

  // Memoizamos saveTokenFromUrl para mantener su referencia estable
  const saveTokenFromUrl = useCallback((rawHash?: string): boolean => {
    const hashToParse = rawHash || window.location.hash;
    if (!hashToParse) return false;

    const cleanHash = hashToParse.startsWith("#")
      ? hashToParse.substring(1)
      : hashToParse;

    const params = new URLSearchParams(cleanHash);
    const accessToken = params.get("access_token");
    const idToken = params.get("id_token");

    if (accessToken) {
      const payload = parseJwt(accessToken);
      const idPayload = idToken ? parseJwt(idToken) : null;

      if (payload) {
        const userRoles = payload["cognito:groups"] || [];
        let primaryRole = userRoles[0] || "ROLE_CLIENTE";
        if (!primaryRole.startsWith("ROLE_")) {
          primaryRole = `ROLE_${primaryRole.toUpperCase()}`;
        }

        const username = payload["username"] || payload["sub"] || "CLI-001";
        const email = idPayload?.email || payload["email"] || "";

        const userInfo: User = {
          id: payload["sub"] || username,
          username,
          email,
        };

        setToken(accessToken);
        setRole(primaryRole);
        setUser(userInfo);

        localStorage.setItem("token", accessToken);
        localStorage.setItem("role", primaryRole);
        localStorage.setItem("user", JSON.stringify(userInfo));

        return true;
      }
    }

    return false;
  }, []);

  const login = useCallback(() => {
    const cognitoUrl = `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=token&scope=email+openid+profile&redirect_uri=${encodeURIComponent(
      REDIRECT_URI,
    )}`;
    window.location.href = cognitoUrl;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.clear();
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, role, user, login, logout, saveTokenFromUrl }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
