import { Route, Routes } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./features/login/LoginPage";

import Test from "./features/test/Test";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CatalogPage } from "./features/catalogo/CatalogoPage";
import { OrdersDashboard } from "./features/oredenes/OrderDashboard";
import { CallbackPage } from "./features/callback/CallbackPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/callback" element={<CallbackPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/catalogo" element={<CatalogPage />} />
      <Route path="/orders" element={<OrdersDashboard />} />
      <Route path="/test" element={<Test />} />
    </Routes>
  );
}

export default App;
