import React, { useState, useEffect } from "react";
import {
  dashboardService,
  type ClienteMetrics,
  type GeneralSummary,
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
  const userId = propUserId || user?.username || user?.id || "";
  const userRole = contextRole || "ROLE_CLIENTE";

  const roleUpper = userRole.toUpperCase();
  const isAdmin = roleUpper.includes("ADMIN");
  const isOperador = roleUpper.includes("OPERADOR");
  const isCliente = !isAdmin && !isOperador;

  const [clienteData, setClienteData] = useState<ClienteMetrics | null>(null);
  const [generalData, setGeneralData] = useState<GeneralSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) return;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        if (isCliente) {
          const data = await dashboardService.getClienteMetrics(userId, token);
          setClienteData(data);
        } else {
          // Tanto Operador como Admin entran aquí
          const data = await dashboardService.getGeneralSummary(token);
          setGeneralData(data);
        }
      } catch (error) {
        console.error("Error al cargar los datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token, userId, isCliente]);

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <p className={styles.loadingText}>Cargando información del panel...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {isCliente && clienteData && <ClienteDashboard data={clienteData} />}
      {!isCliente && generalData && <GeneralDashboard data={generalData} />}
      {!clienteData && !generalData && (
        <p>No hay información disponible para este usuario.</p>
      )}
    </div>
  );
};

/* ==========================================
   --- VISTA CLIENTE (Métricas Personales) ---
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
        <p>
          <strong>Total:</strong> €{data.latestOrder.total.toFixed(2)}
        </p>
      </section>
    )}
  </>
);

/* ==========================================
   --- VISTA COMPARTIDA (Admin & Operador) ---
========================================== */
const GeneralDashboard: React.FC<{ data: GeneralSummary }> = ({ data }) => (
  <>
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>Resumen Operativo del Sistema</h1>
        <p className={styles.subtitle}>
          Monitoreo general de pedidos y alertas de stock bajo.
        </p>
      </div>
    </header>

    <div className={styles.metricsGrid}>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Total Pedidos</span>
        <span className={styles.metricValue}>{data.totalOrders}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>En Proceso / Pendientes</span>
        <span className={styles.metricValue}>{data.pendingOrders}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Entregados</span>
        <span className={styles.metricValue}>{data.deliveredOrders}</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricTitle}>Alertas Stock (&lt; 5)</span>
        <span className={styles.metricValue}>
          {data.lowStockProducts.length}
        </span>
      </div>
    </div>

    <div className={styles.sectionsContainer}>
      <section className={styles.sectionCard}>
        <h3>Últimos Pedidos Registrados</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Total</th>
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
                  <td>€{order.total.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No hay pedidos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className={styles.sectionCard}>
        <h3>Productos con Bajo Stock (&lt; 5 unid.)</h3>
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
                  <td style={{ color: "#d97706", fontWeight: "bold" }}>
                    {product.stock}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No hay productos con bajo stock.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  </>
);
