export type AuthProviderName = "keycloak" | "cognito";

const configuredProvider = import.meta.env.VITE_AUTH_PROVIDER?.toLowerCase();

export const authProvider: AuthProviderName =
  import.meta.env.PROD || configuredProvider === "cognito"
    ? "cognito"
    : "keycloak";

export const authProviderLabel =
  authProvider === "cognito" ? "Amazon Cognito" : "Keycloak";
