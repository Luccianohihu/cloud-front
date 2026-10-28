import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export const CallbackPage: React.FC = () => {
  const { token, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      const requestedPath = sessionStorage.getItem("auth:returnTo");
      const validReturnTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/dashboard";
      const isStaff = role?.toUpperCase().includes("ADMIN") || role?.toUpperCase().includes("OPERADOR");
      const returnTo = validReturnTo === "/" || validReturnTo === "/login"
        ? isStaff ? "/dashboard" : "/catalogo"
        : validReturnTo;
      sessionStorage.removeItem("auth:returnTo");
      navigate(token ? returnTo : "/", { replace: true });
    }
  }, [isLoading, token, role, navigate]);

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <p>Autenticando con Keycloak...</p>
    </div>
  );
};
