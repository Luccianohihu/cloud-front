
import { Route, Routes } from "react-router-dom";
import "./App.css";

import { CallbackPage } from "./features/callback/CallbackPage";
import { CatalogPage } from "./features/catalogo/CatalogoPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { OrdersDashboard } from "./features/ordenes/OrderDashboard";
import { LoginPage } from "./features/login/LoginPage";
import { MainLayout } from "./shared/ui/layout/sidebar/MainLayout";
import { ProtectedRoute } from "./shared/ui/auth/ProtectedRoute";
import { AuthBar } from "./shared/ui/layout/AuthBar";

export default function App() {
  return (
    <>
    <AuthBar />
    <Routes>
      {/* Página inicial: catálogo público */}
      <Route path="/" element={<CatalogPage />} />
      <Route path="/catalogo" element={<CatalogPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Callback OAuth de Keycloak o Cognito */}
      <Route path="/callback" element={<CallbackPage />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersDashboard />} />
        </Route>
      </Route>

      {/* Ruta desconocida */}
      <Route path="*" element={<CatalogPage />} />
    </Routes>
    </>
  );
}
