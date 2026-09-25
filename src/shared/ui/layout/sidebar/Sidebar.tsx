// src/shared/ui/layout/Sidebar.tsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Boxes } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import styles from "./Sidebar.module.css";

export const Sidebar: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Pedidos", path: "/orders", icon: ShoppingBag },
    { label: "Catálogo", path: "/catalogo", icon: Boxes },
  ];

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>A</div>
          <div>
            <div className={styles.brandTitle}>AURA</div>
            <div className={styles.brandSubtitle}>E-COMMERCE</div>
          </div>
        </div>

        <nav className={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                className={isActive ? styles.activeNavItem : styles.navItem}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className={styles.userProfile}>
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
          alt="Usuario"
          className={styles.avatar}
        />
        <div>
          <p className={styles.userName}>
            {user?.username || "Usuario Activo"}
          </p>
          <p className={styles.userRole}>{role || "CLIENTE"}</p>
        </div>
      </div>
    </aside>
  );
};
