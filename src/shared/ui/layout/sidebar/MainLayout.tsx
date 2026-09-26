// src/shared/ui/layout/MainLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const MainLayout: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, padding: "2rem 2.5rem", overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
};
