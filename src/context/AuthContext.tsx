import React, { useCallback, useEffect, useState } from "react";
import Keycloak from "keycloak-js";
import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  signInWithRedirect,
  signOut,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import "aws-amplify/auth/enable-oauth-listener";
import { AuthContext, type User } from "./auth-context";
import { authProvider } from "../config/auth";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "pedidos360",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "pedidos360",
});
let keycloakInitialization: Promise<boolean> | undefined;

const initializeKeycloak = () =>
  (keycloakInitialization ??= keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    silentCheckSsoFallback: false,
  }));

const configureCognito = () => {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const userPoolClientId =
    import.meta.env.VITE_COGNITO_CLIENT_ID || import.meta.env.VITE_COGNITO_CLIEN_ID;
  const domain = import.meta.env.VITE_COGNITO_DOMAIN;

  if (!userPoolId || !userPoolClientId || !domain) {
    throw new Error(
      "Faltan VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID o VITE_COGNITO_DOMAIN.",
    );
  }

  const redirectSignIn =
    import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/callback`;
  const redirectSignOut =
    import.meta.env.VITE_COGNITO_LOGOUT_URI || `${window.location.origin}/catalogo`;

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          oauth: {
            domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
            scopes: ["openid", "email", "profile"],
            redirectSignIn: [redirectSignIn],
            redirectSignOut: [redirectSignOut],
            responseType: "code",
          },
        },
      },
    },
  });
};

const normalizeRole = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const role = value.trim().toUpperCase();
  return role.startsWith("ROLE_") ? role : `ROLE_${role}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncCognitoSession = useCallback(async () => {
    const { tokens } = await fetchAuthSession();
    const accessToken = tokens?.accessToken;
    const idToken = tokens?.idToken;
    const accessClaims = accessToken?.payload ?? {};
    const idClaims = idToken?.payload ?? {};
    const groups = accessClaims["cognito:groups"];
    const roleCandidates = Array.isArray(groups) ? groups : [];
    const recognizedRole = roleCandidates.find((candidate) =>
      ["ADMINISTRADOR", "OPERADOR", "CLIENTE", "ROLE_ADMINISTRADOR", "ROLE_OPERADOR", "ROLE_CLIENTE"].includes(
        String(candidate).toUpperCase(),
      ),
    );
    const username = String(
      idClaims["cognito:username"] ?? idClaims["preferred_username"] ?? idClaims["username"] ?? idClaims.sub ?? "",
    );

    setToken(accessToken?.toString() ?? null);
    setRole(normalizeRole(recognizedRole ?? roleCandidates[0]));
    setUser(
      idToken
        ? {
            id: String(idClaims.sub ?? ""),
            username,
            email: typeof idClaims.email === "string" ? idClaims.email : undefined,
          }
        : null,
    );
  }, []);

  const syncKeycloakSession = useCallback(() => {
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
    setRole(normalizeRole(firstRole));
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
    let stopHubListener: (() => void) | undefined;

    const initialize = async () => {
      try {
        if (authProvider === "cognito") {
          let resolveOAuthCallback: (() => void) | undefined;
          const oauthCallbackProcessed = new Promise<void>((resolve) => {
            resolveOAuthCallback = resolve;
          });
          const isOAuthCallback = new URLSearchParams(window.location.search).has("code");

          stopHubListener = Hub.listen("auth", ({ payload }) => {
            if (["signedIn", "signInWithRedirect", "tokenRefresh"].includes(payload.event)) {
              void syncCognitoSession()
                .catch((error: unknown) => {
                  console.error("No se pudo recuperar la sesión de Cognito:", error);
                  setToken(null);
                  setRole(null);
                  setUser(null);
                })
                .finally(() => resolveOAuthCallback?.());
            } else if (payload.event === "signInWithRedirect_failure") {
              resolveOAuthCallback?.();
            } else if (payload.event === "signedOut") {
              setToken(null);
              setRole(null);
              setUser(null);
            }
          });

          configureCognito();
          if (isOAuthCallback) {
            await Promise.race([
              oauthCallbackProcessed,
              new Promise<void>((resolve) => window.setTimeout(resolve, 15_000)),
            ]);
          } else {
            await syncCognitoSession();
          }
        } else {
          keycloak.onAuthSuccess = () => syncKeycloakSession();
          keycloak.onAuthRefreshSuccess = () => syncKeycloakSession();
          keycloak.onAuthLogout = () => syncKeycloakSession();
          keycloak.onTokenExpired = () => {
            void keycloak.updateToken(30).then(syncKeycloakSession).catch(() => keycloak.logout());
          };
          await initializeKeycloak();
          syncKeycloakSession();
        }
      } catch (error) {
        // A missing Cognito session is expected for signed-out visitors.
        if (authProvider === "cognito") {
          setToken(null);
          setRole(null);
          setUser(null);
          if (import.meta.env.DEV) console.debug("No hay una sesión Cognito activa.", error);
        } else {
          console.error("No se pudo inicializar Keycloak:", error);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void initialize();
    return () => {
      mounted = false;
      stopHubListener?.();
    };
  }, [syncCognitoSession, syncKeycloakSession]);

  useEffect(() => {
    if (authProvider !== "keycloak" || !token) return;
    const refreshTimer = window.setInterval(() => {
      void keycloak.updateToken(30).then(syncKeycloakSession).catch(() => keycloak.logout());
    }, 20_000);
    return () => window.clearInterval(refreshTimer);
  }, [token, syncKeycloakSession]);

  const saveTokenFromUrl = useCallback(
    () => (authProvider === "cognito" ? Boolean(token) : Boolean(keycloak.authenticated)),
    [token],
  );

  const login = useCallback((returnTo = "/dashboard") => {
    const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/dashboard";
    sessionStorage.setItem("auth:returnTo", safeReturnTo);
    if (authProvider === "cognito") {
      void signInWithRedirect().catch((error: unknown) => {
        console.error("No se pudo iniciar sesión con Cognito:", error);
      });
    } else {
      void keycloak.login({ redirectUri: `${window.location.origin}/callback` });
    }
  }, []);

  const logout = useCallback(() => {
    if (authProvider === "cognito") {
      void signOut({ global: true }).finally(() => {
        setToken(null);
        setRole(null);
        setUser(null);
      });
    } else {
      void keycloak.logout({ redirectUri: `${window.location.origin}/catalogo` });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, role, user, isLoading, login, logout, saveTokenFromUrl }}
    >
      {children}
    </AuthContext.Provider>
  );
};
