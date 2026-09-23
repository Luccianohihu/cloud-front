import React, { useState } from "react";
import type { UserRole } from "./DashboardPage.types";
import styles from "./DashboardPage.module.css";

export const DashboardPage: React.FC = () => {
  // Simulación del rol del usuario autenticado (CLIENTE, OPERADOR, ADMIN)
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("OPERADOR");

  return (
    <div className={styles.dashboardContainer}>
      {/* Selector interactivo solo para simulación/pruebas en desarrollo */}
      <div
        style={{
          padding: "0.5rem 1rem",
          background: "#e2e8f0",
          borderRadius: "8px",
          fontSize: "0.8rem",
          marginBottom: "1.5rem",
        }}
      >
        <strong>Simular Rol Autenticado: </strong>
        <button onClick={() => setCurrentUserRole("CLIENTE")}>Cliente</button>
        {" | "}
        <button onClick={() => setCurrentUserRole("OPERADOR")}>Operador</button>
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

/* ==========================================
   --- VISTA CLIENTE (Informativa) ---
========================================== */
const ClienteDashboard: React.FC = () => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel de Cliente</h1>
        <p className={styles.subtitle}>
          Resumen de tus compras activas y estado de tus entregas.
        </p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Mis Pedidos Totales</span>
        <span className={styles.metricValue}>12</span>
        <span className={styles.metricSubtitle}>Histórico registrado</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>En Camino</span>
        <span className={styles.metricValue}>3</span>
        <span className={styles.metricSubtitle}>En preparación/despacho</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Entregados</span>
        <span className={styles.metricValue}>9</span>
        <span className={styles.metricSubtitle}>Completados con éxito</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Gasto Acumulado</span>
        <span className={styles.metricValue}>€850.00</span>
        <span className={styles.metricSubtitle}>Total en compras</span>
      </div>
    </div>

    <section className={styles.sectionCard}>
      <h3>Último Pedido Registrado</h3>
      <div
        style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#334155" }}
      >
        <p>
          <strong>ID:</strong> #PED-2094
        </p>
        <p>
          <strong>Fecha:</strong> 24 Oct 2024
        </p>
        <p>
          <strong>Estado Actual:</strong>{" "}
          <mark
            style={{
              background: "#fef3c7",
              color: "#d97706",
              padding: "2px 8px",
              borderRadius: "4px",
              fontWeight: 600,
            }}
          >
            EN PREPARACIÓN
          </mark>
        </p>
      </div>
    </section>
  </>
);

/* ==========================================
   --- VISTA OPERADOR (Informativa) ---
========================================== */
const OperadorDashboard: React.FC = () => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel Operativo</h1>
        <p className={styles.subtitle}>
          Estado general del flujo de pedidos y monitoreo de almacén.
        </p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Pendientes</span>
        <span className={styles.metricValue}>5</span>
        <span className={styles.metricSubtitle}>Por validar stock</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>En Preparación</span>
        <span className={styles.metricValue}>7</span>
        <span className={styles.metricSubtitle}>En empaque y empaque</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Por Despachar</span>
        <span className={styles.metricValue}>14</span>
        <span className={styles.metricSubtitle}>Listos en almacén</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Alertas de Stock</span>
        <span className={styles.metricValue}>2</span>
        <span className={styles.metricSubtitle}>Bajo el límite mínimo</span>
      </div>
    </div>

    <section className={styles.sectionCard}>
      <h3>Monitoreo de Pedidos Recientes</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Estado Actual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#PED-3012</td>
            <td>Juan Pérez</td>
            <td>Hoy, 10:30 AM</td>
            <td>
              <span className={styles.badgeWarning}>CREADO</span>
            </td>
          </tr>
          <tr>
            <td>#PED-3010</td>
            <td>María López</td>
            <td>Hoy, 09:15 AM</td>
            <td>
              <span className={styles.badgeInfo}>EN PREPARACIÓN</span>
            </td>
          </tr>
          <tr>
            <td>#PED-3008</td>
            <td>Carlos Ruiz</td>
            <td>Ayer</td>
            <td>
              <span className={styles.badgeSuccess}>DESPACHADO</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </>
);

/* ==========================================
   --- VISTA ADMINISTRADOR (Informativa) ---
========================================== */
const AdminDashboard: React.FC = () => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel de Administración Global</h1>
        <p className={styles.subtitle}>
          Métricas consolidadas del negocio, catálogo e inventario general.
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
        <span className={styles.metricSubtitle}>Plataforma global</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Productos Activos</span>
        <span className={styles.metricValue}>48</span>
        <span className={styles.metricSubtitle}>Catálogo disponible</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Sin Stock</span>
        <span className={styles.metricValue}>3</span>
        <span className={styles.metricSubtitle}>Requieren reposición</span>
      </div>
    </div>

    <section className={styles.sectionCard}>
      <h3>Resumen Operativo del Sistema</h3>
      <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
        Visualización del estado consolidado entre los microservicios
        <code>ms-pedidos360-orders</code> y <code>ms-pedidos360-catalog</code>.
      </p>
    </section>
  </>
);
