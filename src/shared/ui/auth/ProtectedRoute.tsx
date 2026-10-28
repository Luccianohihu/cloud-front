
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";

function isTokenExpired(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return true;

    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp !== "number") return true;

    return payload.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

export function ProtectedRoute() {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <p role="status">Verificando sesión...</p>;

  if (!token || isTokenExpired(token)) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
