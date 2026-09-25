// src/App.tsx
import { Route, Routes } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./features/login/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CatalogPage } from "./features/catalogo/CatalogoPage";
import { OrdersDashboard } from "./features/oredenes/OrderDashboard";
import { CallbackPage } from "./features/callback/CallbackPage";
import Test from "./features/test/Test";
import { MainLayout } from "./shared/ui/layout/sidebar/MainLayout";

function App() {
  return (
    <Routes>
      {/* Rutas sin Sidebar */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/test" element={<Test />} />

      {/* Rutas con Sidebar (Layout Global) */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/orders" element={<OrdersDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
