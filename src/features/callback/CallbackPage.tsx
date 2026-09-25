// src/pages/callback/CallbackPage.tsx
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const CallbackPage: React.FC = () => {
  const { saveTokenFromUrl } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false); // Guard para evitar la doble ejecución

  useEffect(() => {
    // Si ya se procesó en la primera iteración, ignoramos ejecuciones posteriores
    if (hasProcessed.current) return;

    const currentHash = window.location.hash;

    if (currentHash && currentHash.includes("access_token")) {
      hasProcessed.current = true;
      const isSaved = saveTokenFromUrl(currentHash);

      if (isSaved) {
        navigate("/catalogo", { replace: true });
      } else {
        console.error("No se pudo extraer el access_token del hash.");
        navigate("/", { replace: true });
      }
    } else if (!currentHash && !hasProcessed.current) {
      hasProcessed.current = true;
      console.error("No hay hash en la URL.");
      navigate("/", { replace: true });
    }
  }, [saveTokenFromUrl, navigate]);

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <p>Autenticando con AWS Cognito...</p>
    </div>
  );
};
