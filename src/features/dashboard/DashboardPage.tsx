// src/features/dashboard/DashboardPage.tsx

import React, { useState, useEffect } from "react";
import {
  dashboardService,
  type ClienteMetrics,
  type OperadorMetrics,
  type AdminMetrics,
} from "./DashboardService";
import { useAuth } from "../../context/AuthContext";
import styles from "./DashboardPage.module.css";

interface DashboardPageProps {
  userId?: string;
  accessToken?: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  userId: propUserId,
  accessToken: propToken,
}) => {
  const { token: contextToken, role: contextRole, user } = useAuth();

  const token = propToken || contextToken || undefined;
  const userId = user?.username || user?.id || propUserId || "CLI-001";
  const userRole = contextRole || "ROLE_CLIENTE";

  // Identificación dinámica con priorización de roles
  const roleUpper = userRole.toUpperCase();
  const isAdmin = roleUpper.includes("ADMIN");
  const isOperador = roleUpper.includes("OPERADOR") && !isAdmin;
  const isCliente = roleUpper.includes("CLIENTE") && !isAdmin && !isOperador;

  const [clienteData, setClienteData] = useState<ClienteMetrics | null>(null);
  const [operadorData, setOperadorData] = useState<OperadorMetrics | null>(
    null,
  );
  const [adminData, setAdminData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const data = await dashboardService.getAdminMetrics(token);
          setAdminData(data);
        } else if (isOperador) {
          const data = await dashboardService.getOperadorMetrics(token);
          setOperadorData(data);
        } else if (isCliente) {
          const data = await dashboardService.getClienteMetrics(userId, token);
          setClienteData(data);
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadDashboardData();
    }
  }, [userRole, userId, token, isCliente, isOperador, isAdmin]);

  return (
    <div className={styles.dashboardContainer}>
      {loading ? (
        <p className={styles.loadingText}>Cargando métricas en vivo...</p>
      ) : (
        <>
          {isAdmin && adminData && <AdminDashboard data={adminData} />}
          {isOperador && operadorData && (
            <OperadorDashboard data={operadorData} />
          )}
          {isCliente && clienteData && <ClienteDashboard data={clienteData} />}
          {!clienteData && !operadorData && !adminData && (
            <p>No se encontraron datos disponibles para tu usuario.</p>
          )}
        </>
      )}
    </div>
  );
};

/* ==========================================
   --- VISTA CLIENTE ---
========================================== */
const ClienteDashboard: React.FC<{ data: ClienteMetrics }> = ({ data }) => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel de Cliente</h1>
        <p className={styles.subtitle}>Resumen de tus compras y entregas.</p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Mis Pedidos Totales</span>
        <span className={styles.metricValue}>{data.totalOrders}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>En Proceso</span>
        <span className={styles.metricValue}>{data.inProgressOrders}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Entregados</span>
        <span className={styles.metricValue}>{data.deliveredOrders}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Gasto Acumulado</span>
        <span className={styles.metricValue}>
          €{data.totalSpent.toLocaleString()}
        </span>
      </div>
    </div>

    {data.latestOrder && (
      <section className={styles.sectionCard}>
        <h3>Último Pedido Registrado</h3>
        <p>
          <strong>ID:</strong> #{data.latestOrder.id.substring(0, 8)}...
        </p>
        <p>
          <strong>Fecha:</strong> {data.latestOrder.createdAt}
        </p>
        <p>
          <strong>Estado:</strong> {data.latestOrder.status}
        </p>
      </section>
    )}
  </>
);

/* ==========================================
   --- VISTA OPERADOR ---
========================================== */
const OperadorDashboard: React.FC<{ data: OperadorMetrics }> = ({ data }) => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel Operativo</h1>
        <p className={styles.subtitle}>Estado del flujo de pedidos y stock.</p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Pendientes (Creados)</span>
        <span className={styles.metricValue}>{data.pendingCount}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>En Preparación</span>
        <span className={styles.metricValue}>{data.inPreparationCount}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Listos (Aceptados)</span>
        <span className={styles.metricValue}>{data.readyToShipCount}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Alertas de Stock (&lt;5)</span>
        <span className={styles.metricValue}>{data.stockAlertsCount}</span>
      </div>
    </div>

    <div className={styles.sectionsContainer}>
      <section className={styles.sectionCard}>
        <h3>Monitoreo de Pedidos Recientes</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id.substring(0, 8)}...</td>
                  <td>{order.customerId}</td>
                  <td>{order.createdAt}</td>
                  <td>
                    <span className={styles.badge}>{order.status}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No hay pedidos recientes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className={styles.sectionCard}>
        <h3>Productos con Bajo Stock (&lt; 5 unidades)</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Stock Restante</th>
            </tr>
          </thead>
          <tbody>
            {data.lowStockProducts.length > 0 ? (
              data.lowStockProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>€{product.price.toFixed(2)}</td>
                  <td style={{ color: "orange", fontWeight: "bold" }}>
                    {product.stock}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No hay alertas de stock bajo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  </>
);

/* ==========================================
   --- VISTA ADMINISTRADOR ---
========================================== */
const AdminDashboard: React.FC<{ data: AdminMetrics }> = ({ data }) => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Panel de Administración Global</h1>
        <p className={styles.subtitle}>Métricas consolidadas del negocio.</p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Ventas Totales</span>
        <span className={styles.metricValue}>
          €{data.totalSales.toLocaleString()}
        </span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Total Pedidos</span>
        <span className={styles.metricValue}>{data.totalOrders}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Productos Activos</span>
        <span className={styles.metricValue}>{data.activeProductsCount}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Sin Stock</span>
        <span className={styles.metricValue}>{data.outOfStockCount}</span>
      </div>
    </div>

    <div className={styles.sectionsContainer}>
      <section className={styles.sectionCard}>
        <h3>Últimas Transacciones Registradas</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Monto Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.recentOrders.length > 0 ? (
              data.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id.substring(0, 8)}...</td>
                  <td>{order.customerId}</td>
                  <td>€{order.total.toFixed(2)}</td>
                  <td>
                    <span className={styles.badge}>{order.status}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No hay ventas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className={styles.sectionCard}>
        <h3>Productos Agotados (Stock 0)</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Producto</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {data.outOfStockProducts.length > 0 ? (
              data.outOfStockProducts.map((product) => (
                <tr key={product.id}>
                  <td>#{product.id.substring(0, 8)}...</td>
                  <td>{product.name}</td>
                  <td>€{product.price.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>Todos los productos cuentan con stock.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  </>
);
