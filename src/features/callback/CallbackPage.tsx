// src/pages/callback/CallbackPage.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const CallbackPage: React.FC = () => {
  const { saveTokenFromUrl } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash) {
      saveTokenFromUrl(window.location.hash);
      navigate("/catalog");
    } else {
      navigate("/login");
    }
  }, []);

  return <div>Autenticando con AWS Cognito...</div>;
};
