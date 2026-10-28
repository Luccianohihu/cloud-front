import { LogIn, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import styles from "./AuthBar.module.css";

export function AuthBar() {
  const { token, user, isLoading, login, logout } = useAuth();
  const location = useLocation();

  const handleLogin = () => {
    const returnTo = location.pathname === "/login"
      ? "/dashboard"
      : `${location.pathname}${location.search}`;
    login(returnTo);
  };

  return (
    <header className={styles.bar}>
      <span className={styles.brand}>Pedidos360</span>
      {isLoading ? (
        <span className={styles.status} role="status">Verificando sesión...</span>
      ) : token ? (
        <div className={styles.account}>
          <nav className={styles.navigation} aria-label="Navegación de cuenta">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/orders">Pedidos</Link>
            <Link to="/catalogo">Catálogo</Link>
          </nav>
          <span className={styles.username}>{user?.username || "Cuenta activa"}</span>
          <button className={styles.button} onClick={logout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      ) : (
        <button className={styles.button} onClick={handleLogin}>
          <LogIn size={16} />
          Iniciar sesión
        </button>
      )}
    </header>
  );
}
