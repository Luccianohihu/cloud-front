import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./OrderDashboard.module.css";
import {
  orderService,
  type Order,
  type OrderStatus,
} from "./OrderService";
import { useAuth } from "../../context/useAuth";
import { dashboardService } from "../dashboard/DashboardService";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);

const formatClientId = (clientId: string) =>
  clientId && clientId !== "N/A" ? `${clientId.slice(0, 8)}…` : "—";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREADO: "CREADO",
  ACEPTADO: "ACEPTADO",
  EN_PREPARACION: "EN PREPARACIÓN",
  DESPACHADO: "DESPACHADO",
  ENTREGADO: "ENTREGADO",
  CANCELADO: "CANCELADO",
};

const NEXT_ORDER_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  ACEPTADO: ["EN_PREPARACION"],
  EN_PREPARACION: ["DESPACHADO"],
  DESPACHADO: ["ENTREGADO"],
};

export type UserRole =
  | "ROLE_CLIENTE"
  | "ROLE_OPERADOR"
  | "ROLE_ADMINISTRADOR"
  | "CLIENTE"
  | "OPERADOR"
  | "ADMINISTRADOR";

interface OrdersDashboardProps {
  userRole?: UserRole;
  accessToken?: string;
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  userRole: propRole,
  accessToken: propToken,
}) => {
  const {
    token: contextToken,
    role: contextRole,
    user: contextUser,
  } = useAuth();

  const token = propToken || contextToken || undefined;

  const rawRole =
    propRole ||
    contextRole ||
    (contextUser as any)?.roles ||
    (contextUser as any)?.authorities ||
    (contextUser as any)?.role ||
    "";

  const roleString =
    typeof rawRole === "object"
      ? JSON.stringify(rawRole).toUpperCase()
      : String(rawRole).toUpperCase();

  const isOperador = roleString.includes("OPERADOR");
  const isAdmin = roleString.includes("ADMINISTRADOR");
  const isCliente = roleString.includes("CLIENTE") && !isOperador && !isAdmin;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("TODOS");
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [summaryCounts, setSummaryCounts] = useState<Record<string, number>>({});
  const [summaryTotalOrders, setSummaryTotalOrders] = useState<number | null>(null);

  useEffect(() => {
    if (!token || (!isOperador && !isAdmin)) return;
    let active = true;
    void dashboardService.getOrderSummaryMetrics(token).then((summary) => {
      if (!active) return;
      setSummaryCounts(summary.statusCounts);
      setSummaryTotalOrders(summary.totalOrders);
    }).catch((error) => {
      console.error("No se pudieron cargar los contadores de órdenes:", error);
    });
    return () => {
      active = false;
    };
  }, [token, isOperador, isAdmin]);
  
  const fetchOrders = useCallback(async () => {
  setLoading(true);
  if (!token) {
    setOrders([]);
    setTotalElements(0);
    setTotalPages(1);
    setLoading(false);
    return;
  }

  try {
    if (isOperador || isAdmin) {
      const statusByTab: Record<string, OrderStatus> = {
        CREADOS: "CREADO",
        ENTREGADOS: "ENTREGADO",
        CANCELADOS: "CANCELADO",
      };
      const result = await orderService.getOrdersPage(
        token,
        pageIndex,
        10,
        statusByTab[activeTab],
      );
      setOrders(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(Math.max(1, result.totalPages));
    } else {
      const data = await orderService.getOrdersByCustomer(token);
      setOrders(data);
      setTotalElements(data.length);
      setTotalPages(1);
    }
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
  } finally {
    setLoading(false);
  }
}, [isOperador, isAdmin, token, pageIndex, activeTab]);

  useEffect(() => {
  void fetchOrders();
}, [fetchOrders]);

  
  const metrics = useMemo(() => {
    return {
      total: isOperador || isAdmin ? summaryTotalOrders ?? totalElements : orders.length,
      creados: isOperador || isAdmin
        ? summaryCounts.CREADO ?? orders.filter((o) => o.status === "CREADO").length
        : orders.filter((o) => o.status === "CREADO").length,
      enProceso: isOperador || isAdmin
        ? (summaryCounts.ACEPTADO || 0) + (summaryCounts.EN_PREPARACION || 0) + (summaryCounts.DESPACHADO || 0)
        : orders.filter((o) => ["ACEPTADO", "EN_PREPARACION", "DESPACHADO"].includes(o.status)).length,
      entregados: isOperador || isAdmin
        ? summaryCounts.ENTREGADO ?? orders.filter((o) => o.status === "ENTREGADO").length
        : orders.filter((o) => o.status === "ENTREGADO").length,
      cancelados: isOperador || isAdmin
        ? summaryCounts.CANCELADO ?? orders.filter((o) => o.status === "CANCELADO").length
        : orders.filter((o) => o.status === "CANCELADO").length,
    };
  }, [orders, isOperador, isAdmin, totalElements, summaryCounts, summaryTotalOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.createdAt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab =
        activeTab === "TODOS" ||
        (activeTab === "CREADOS" && order.status === "CREADO") ||
        (activeTab === "EN_PROCESO" &&
          (order.status === "ACEPTADO" ||
            order.status === "EN_PREPARACION" ||
            order.status === "DESPACHADO")) ||
        (activeTab === "ENTREGADOS" && order.status === "ENTREGADO") ||
        (activeTab === "CANCELADOS" && order.status === "CANCELADO");

      return matchesSearch && matchesTab;
    });
  }, [orders, searchTerm, activeTab]);

  const handleStatusChange = async (
    orderId: string,
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ) => {
    if (!NEXT_ORDER_STATUSES[currentStatus]?.includes(newStatus)) return;

    try {
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        newStatus,
        token,
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: updatedOrder.status } : o,
        ),
      );
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("No se pudo actualizar el estado del pedido en el servidor.");
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const accepted = await orderService.acceptOrder(orderId, token);
      setOrders((prev) => prev.map((order) =>
        order.id === orderId
          ? { ...order, ...(accepted || {}), status: "ACEPTADO" }
          : order,
      ));
    } catch {
      alert("No se pudo aceptar el pedido ni descontar su stock.");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("¿Seguro que deseas cancelar el pedido #" + orderId + "?")) return;
    try {
      await orderService.cancelOrder(orderId, token);
      setOrders((prev) => prev.map((order) =>
        order.id === orderId ? { ...order, status: "CANCELADO" } : order,
      ));
    } catch {
      alert("Error al intentar cancelar el pedido.");
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "CREADO":
        return styles.badgeInfo;
      case "ACEPTADO":
      case "EN_PREPARACION":
        return styles.badgeWarning;
      case "DESPACHADO":
      case "ENTREGADO":
        return styles.badgeSuccess;
      case "CANCELADO":
        return styles.badgeDanger;
      default:
        return styles.badgeInfo;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {isCliente ? "Mis Pedidos" : "Gestión Operativa de Pedidos"}
          </h1>
          <p className={styles.subtitle}>
            {isCliente
              ? "Consulta el estado actual y el historial de tus compras."
              : "Gestión de flujos de estado, despacho y administración general."}
          </p>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Pedidos Totales</span>
          <span className={styles.metricValue}>{metrics.total}</span>
          <span className={styles.metricSubtitle}>Registrados</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Nuevos</span>
          <span className={styles.metricValue}>{metrics.creados}</span>
          <span className={styles.metricSubtitle}>Recién ingresados</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>En Proceso / Despacho</span>
          <span className={styles.metricValue}>{metrics.enProceso}</span>
          <span className={styles.metricSubtitle}>En flujo operativo</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Entregados</span>
          <span className={styles.metricValue}>{metrics.entregados}</span>
          <span className={styles.metricSubtitle}>Completados con éxito</span>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.filterBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por ID, cliente o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className={styles.tabs}>
            {["TODOS", "CREADOS", "EN_PROCESO", "ENTREGADOS", "CANCELADOS"].map(
              (tab) => (
                <button
                  key={tab}
                  className={
                    activeTab === tab ? styles.tabActive : styles.tabButton
                  }
                  onClick={() => {
                    setActiveTab(tab);
                    setPageIndex(0);
                  }}
                >
                  {tab.replace("_", " ")}
                </button>
              ),
            )}
          </div>
        </div>

        {loading ? (
          <p className={styles.loadingText}>Cargando pedidos del sistema...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID PEDIDO</th>
                <th>FECHA</th>
                <th>CLIENTE</th>
                <th>ESTADO ACTUAL</th>
                <th>TOTAL</th>
                <th style={{ textAlign: "right" }}>
                  {isCliente ? "ESTADO" : "ACCIONES Y ESTADO"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    No se encontraron pedidos.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className={styles.boldText}>
                      #{order.id.substring(0, 8)}...
                    </td>
                    <td>{order.createdAt}</td>
                    <td>{formatClientId(order.customerId)}</td>
                    <td>
                      <span className={getStatusBadge(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className={styles.boldText}>
                      {formatCurrency(order.total)}
                    </td>

                    <td className={styles.actionColumn}>
                      {isCliente ? (
                        <div style={{ textAlign: "right" }}>
                          <span className={getStatusBadge(order.status)}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                          }}
                        >
                          {order.status === "CREADO" && (
                            <button
                              className={styles.btnPrimary}
                              onClick={() => void handleAcceptOrder(order.id)}
                            >
                              Aceptar
                            </button>
                          )}
                          {(NEXT_ORDER_STATUSES[order.status]?.length ?? 0) > 0 && (
                            <select
                              className={styles.statusSelect}
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  order.id,
                                  order.status,
                                  e.target.value as OrderStatus,
                                )
                              }
                            >
                              <option value={order.status} disabled>
                                {ORDER_STATUS_LABELS[order.status]}
                              </option>
                              {NEXT_ORDER_STATUSES[order.status]?.map((status) => (
                                <option key={status} value={status}>
                                  {ORDER_STATUS_LABELS[status]}
                                </option>
                              ))}
                            </select>
                          )}

                          {order.status !== "CANCELADO" && order.status !== "ENTREGADO" && (
                            <button
                              className={styles.btnDanger}
                              onClick={() => void handleCancelOrder(order.id)}
                              style={{ marginLeft: "0.5rem" }}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
        {(isOperador || isAdmin) && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", alignItems: "center", marginTop: "1rem" }}>
            <button
              className={styles.tabButton}
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
            >
              Anterior
            </button>
            <span>Página {pageIndex + 1} de {totalPages}</span>
            <button
              className={styles.tabButton}
              disabled={pageIndex + 1 >= totalPages}
              onClick={() => setPageIndex((current) => Math.min(totalPages - 1, current + 1))}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
