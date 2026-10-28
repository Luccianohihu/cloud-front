import React, { useCallback, useEffect, useState } from "react";
import Keycloak from "keycloak-js";
import { AuthContext, type User } from "./auth-context";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "pedidos360",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "pedidos360",
});
let initialization: Promise<boolean> | undefined;

const initializeKeycloak = () =>
  (initialization ??= keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    silentCheckSsoFallback: false,
  }));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = useCallback(() => {
    const claims = keycloak.tokenParsed;
    const roles = [
      ...(claims?.realm_access?.roles ?? []),
      ...(claims?.resource_access?.[keycloak.clientId ?? ""]?.roles ?? []),
    ];
    const knownRole = roles.find((candidate) =>
      ["ADMINISTRADOR", "OPERADOR", "CLIENTE", "ROLE_ADMINISTRADOR", "ROLE_OPERADOR", "ROLE_CLIENTE"].includes(candidate.toUpperCase()),
    );
    const firstRole = knownRole ?? roles.find((candidate) =>
      !["OFFLINE_ACCESS", "UMA_AUTHORIZATION"].includes(candidate.toUpperCase()) &&
      !candidate.toUpperCase().startsWith("DEFAULT-ROLES"),
    );
    setToken(keycloak.token ?? null);
    setRole(
      firstRole
        ? firstRole.startsWith("ROLE_")
          ? firstRole
          : `ROLE_${firstRole.toUpperCase()}`
        : null,
    );
    setUser(
      claims
        ? {
            id: claims.sub ?? "",
            username: claims.preferred_username ?? claims.sub ?? "",
            email: claims.email,
          }
        : null,
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    keycloak.onAuthSuccess = syncSession;
    keycloak.onAuthRefreshSuccess = syncSession;
    keycloak.onAuthLogout = syncSession;
    keycloak.onTokenExpired = () => {
      void keycloak.updateToken(30).then(syncSession).catch(() => keycloak.logout());
    };

    void initializeKeycloak()
      .then(() => {
        if (mounted) syncSession();
      })
      .catch((error: unknown) => {
        console.error("No se pudo inicializar Keycloak:", error);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [syncSession]);

  useEffect(() => {
    if (!token) return;
    const refreshTimer = window.setInterval(() => {
      void keycloak.updateToken(30).then(syncSession).catch(() => keycloak.logout());
    }, 20_000);
    return () => window.clearInterval(refreshTimer);
  }, [token, syncSession]);

  const saveTokenFromUrl = useCallback(() => Boolean(keycloak.authenticated), []);
  const login = useCallback((returnTo = "/dashboard") => {
    const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/dashboard";
    sessionStorage.setItem("auth:returnTo", safeReturnTo);
    void keycloak.login({ redirectUri: `${window.location.origin}/callback` });
  }, []);
  const logout = useCallback(() => {
    void keycloak.logout({
      redirectUri: `${window.location.origin}/catalogo`,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, role, user, isLoading, login, logout, saveTokenFromUrl }}
    >
      {children}
    </AuthContext.Provider>
  );
};
