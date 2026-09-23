import { Route, Routes } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./features/login/LoginPage";
import Test from "./features/test/Test";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { CatalogPage } from "./features/catalogo/CatalogoPage";
import { OrdersDashboard } from "./features/oredenes/OrderDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/catalogo" element={<CatalogPage />} />
      <Route
        path="/orders"
        element={<OrdersDashboard userRole="ROLE_ADMINISTRADOR" userId="123" />}
      />
      <Route path="/test" element={<Test />} />
    </Routes>
  );
}

export default App;
