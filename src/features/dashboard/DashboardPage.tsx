import React, { useState } from "react";
import {
  Package,
  ShoppingBag,
  AlertTriangle,
  Users,
  ArrowRight,
} from "lucide-react";
import { CustomButton } from "../../shared/ui/atomos/custom-button/CustomButton";
import type { UserRole } from "./DashboardPage.types";
import styles from "./DashboardPage.module.css";

export const DashboardPage: React.FC = () => {
  // Simulación del rol del usuario autenticado (ADMIN, OPERADOR o CLIENTE)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("OPERADOR");

  return (
    <div className={styles.dashboardContainer}>
      {/* Selector interactivo solo para simulación/pruebas en desarrollo */}
      <div
        style={{
          padding: "0.5rem",
          background: "#e2e8f0",
          borderRadius: "8px",
          fontSize: "0.8rem",
        }}
      >
        <strong>Simular Rol Autenticado: </strong>
        <button onClick={() => setCurrentUserRole("CLIENTE")}>
          Cliente
        </button>{" "}
        {" | "}
        <button onClick={() => setCurrentUserRole("OPERADOR")}>
          Operador
        </button>{" "}
        {" | "}
        <button onClick={() => setCurrentUserRole("ADMIN")}>Admin</button>
      </div>

      {/* Renderizado condicional del Dashboard correspondiente */}
      {currentUserRole === "CLIENTE" && <ClienteDashboard />}
      {currentUserRole === "OPERADOR" && <OperadorDashboard />}
      {currentUserRole === "ADMIN" && <AdminDashboard />}
    </div>
  );
};

/* --- VISTA CLIENTE --- */
const ClienteDashboard: React.FC = () => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel de Cliente</h1>
        <p className={styles.subtitle}>
          Resumen de tus compras activas y estado de entregas.
        </p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Mis Pedidos Totales</span>
        <span className={styles.metricValue}>12</span>
        <span className={styles.metricSubtitle}>3 en seguimiento</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Enviados</span>
        <span className={styles.metricValue}>8</span>
        <span className={styles.metricSubtitle}>En camino a destino</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Entregados</span>
        <span className={styles.metricValue}>4</span>
        <span className={styles.metricSubtitle}>En los últimos 30 días</span>
      </div>
    </div>

    <section className={styles.sectionCard}>
      <h3>Último Pedido en Curso</h3>
      <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
        Pedido <strong>#PED-2094</strong> - Estado:{" "}
        <mark style={{ background: "#fef3c7", padding: "2px 6px" }}>
          EN PREPARACIÓN
        </mark>
      </p>
    </section>
  </>
);

/* --- VISTA OPERADOR --- */
const OperadorDashboard: React.FC = () => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel Operativo</h1>
        <p className={styles.subtitle}>
          Gestión diaria de flujo de pedidos y stock rápido.
        </p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Pendientes por Aceptar</span>
        <span className={styles.metricValue}>5</span>
        <span className={styles.metricSubtitle}>
          Requieren validación de stock
        </span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Por Despachar</span>
        <span className={styles.metricValue}>14</span>
        <span className={styles.metricSubtitle}>Listos en almacén</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Alertas de Stock</span>
        <span className={styles.metricValue}>2</span>
        <span className={styles.metricSubtitle}>Productos bajo el mínimo</span>
      </div>
    </div>

    <section className={styles.sectionCard}>
      <h3>Cola de Atención Rápida (PUT /api/v1/orders/status)</h3>[cite: 2]
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Cliente</th>
            <th>Estado Actual</th>
            <th>Acción Requerida</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#PED-3012</td>
            <td>Juan Pérez</td>
            <td>CREADO</td>
            <td>
              <button className={styles.actionBadge}>Aceptar Pedido</button>
            </td>
          </tr>
          <tr>
            <td>#PED-3010</td>
            <td>María López</td>
            <td>EN_PREPARACIÓN</td>
            <td>
              <button className={styles.actionBadge}>Despachar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </>
);

/* --- VISTA ADMINISTRADOR --- */
const AdminDashboard: React.FC = () => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel de Administración Global</h1>
        <p className={styles.subtitle}>
          Métricas del sistema, rendimiento de ventas e inventario global.
        </p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Ventas Totales</span>
        <span className={styles.metricValue}>€14,250</span>
        <span className={styles.metricSubtitle}>
          +12% respecto al mes anterior
        </span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Total Pedidos</span>
        <span className={styles.metricValue}>342</span>
        <span className={styles.metricSubtitle}>Global de la plataforma</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Productos Activos</span>
        <span className={styles.metricValue}>48</span>
        <span className={styles.metricSubtitle}>Catálogo general</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Sin Stock</span>
        <span className={styles.metricValue}>3</span>
        <span className={styles.metricSubtitle}>
          Requieren reabastecimiento
        </span>
      </div>
    </div>

    <section className={styles.sectionCard}>
      <h3>Resumen Operativo del Sistema</h3>
      <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
        Visualización completa de la plataforma (`ms-pedidos360-orders` y
        `ms-pedidos360-catalog`).
      </p>
    </section>
  </>
);
