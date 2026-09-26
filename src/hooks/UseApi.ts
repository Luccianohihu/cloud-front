// src/hooks/useApi.ts

import { useAuth } from "../context/AuthContext";

const BFF_BASE_URL = "http://localhost:8080"; // URL de tu Spring Boot BFF

export const useApi = () => {
  const { accessToken } = useAuth();

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${BFF_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      alert("Sesión expirada. Por favor vuelve a iniciar sesión.");
      window.location.href = "/login";
      throw new Error("No autorizado");
    }

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.statusText}`);
    }

    if (response.status === 204) return null; // No Content

    return response.json();
  };

  return {
    get: (endpoint: string) => fetchWithAuth(endpoint, { method: "GET" }),
    post: (endpoint: string, body: any) =>
      fetchWithAuth(endpoint, { method: "POST", body: JSON.stringify(body) }),
    put: (endpoint: string, body: any) =>
      fetchWithAuth(endpoint, { method: "PUT", body: JSON.stringify(body) }),
    delete: (endpoint: string) => fetchWithAuth(endpoint, { method: "DELETE" }),
  };
};
