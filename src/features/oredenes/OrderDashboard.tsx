import React, { useState, useEffect, useMemo } from "react";
import styles from "./OrderDashboard.module.css";
import {
  orderService,
  type CreateOrderPayload,
  type Order,
  type OrderStatus,
} from "./OrderService";
import { useAuth } from "../../context/AuthContext";

export type UserRole =
  | "ROLE_CLIENTE"
  | "ROLE_OPERADOR"
  | "ROLE_ADMINISTRADOR"
  | "CLIENTE"
  | "OPERADOR"
  | "ADMINISTRADOR";

interface OrdersDashboardProps {
  userRole?: UserRole;
  userId?: string;
  accessToken?: string;
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  userRole: propRole,
  userId: propUserId,
  accessToken: propToken,
}) => {
  const {
    token: contextToken,
    role: contextRole,
    user: contextUser,
  } = useAuth();

  const token = propToken || contextToken || undefined;

  // 1. Detección profunda de roles (soporta objetos de Spring Security)
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

  const userId =
    propUserId || contextUser?.username || contextUser?.id || "CLI-UNKNOWN";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("TODOS");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newOrderTotal, setNewOrderTotal] = useState<number>(15000);

  useEffect(() => {
    fetchOrders();
  }, [roleString, userId, token]);

  // 2. Carga con prioridad a perfiles operativos
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let data: Order[] = [];
      if (isOperador || isAdmin) {
        data = await orderService.getAllOrders(token);
      } else {
        data = await orderService.getOrdersByCustomer(userId, token);
      }
      setOrders(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    return {
      total: orders.length,
      creados: orders.filter(
        (o) =>
          o.status === "CREADO" ||
          o.status === "ACEPTADO" ||
          o.status === "PENDIENTE",
      ).length,
      despachados: orders.filter(
        (o) =>
          o.status === "DESPACHADO" ||
          o.status === "EN_PREPARACIÓN" ||
          o.status === "EN_PROCESO",
      ).length,
      entregados: orders.filter(
        (o) => o.status === "ENTREGADO" || o.status === "COMPLETADO",
      ).length,
      cancelados: orders.filter((o) => o.status === "CANCELADO").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.createdAt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab =
        activeTab === "TODOS" ||
        (activeTab === "CREADOS" &&
          (order.status === "CREADO" ||
            order.status === "ACEPTADO" ||
            order.status === "PENDIENTE")) ||
        (activeTab === "EN_PROCESO" &&
          (order.status === "EN_PREPARACIÓN" ||
            order.status === "DESPACHADO" ||
            order.status === "EN_PROCESO")) ||
        (activeTab === "ENTREGADOS" &&
          (order.status === "ENTREGADO" || order.status === "COMPLETADO")) ||
        (activeTab === "CANCELADOS" && order.status === "CANCELADO");

      return matchesSearch && matchesTab;
    });
  }, [orders, searchTerm, activeTab]);

  const handleStatusChange = async (
    orderId: string,
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ) => {
    if (
      newStatus === "DESPACHADO" &&
      (currentStatus === "CREADO" || currentStatus === "PENDIENTE")
    ) {
      alert(
        "Regla de Negocio: Un pedido debe estar en estado ACEPTADO o EN PREPARACIÓN antes de ser DESPACHADO.",
      );
      return;
    }

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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateOrderPayload = {
        customerId: userId,
        total: newOrderTotal,
        items: [{ productId: "PROD-001", quantity: 1, price: newOrderTotal }],
      };

      const createdOrder = await orderService.createOrder(payload, token);
      setOrders((prev) => [createdOrder, ...prev]);
      setShowCreateModal(false);
      alert("¡Pedido creado exitosamente!");
    } catch (error) {
      alert("Error al crear el pedido en el servidor.");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (
      !window.confirm(
        `¿Deseas cancelar el pedido #${orderId.substring(0, 8)}...?`,
      )
    )
      return;

    try {
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        "CANCELADO",
        token,
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: updatedOrder.status } : o,
        ),
      );
      alert("Pedido cancelado correctamente.");
    } catch (error) {
      alert("No se pudo cancelar el pedido.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el pedido #${orderId}?`))
      return;

    try {
      await orderService.deleteOrder(orderId, token);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      alert("Error al intentar eliminar el pedido.");
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "CREADO":
      case "PENDIENTE":
        return styles.badgeInfo;
      case "ACEPTADO":
      case "EN_PREPARACIÓN":
      case "EN_PROCESO":
        return styles.badgeWarning;
      case "DESPACHADO":
      case "ENTREGADO":
      case "COMPLETADO":
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
              ? "Consulta el estado, realiza seguimiento o cancela tus compras."
              : "Gestión de flujos de estado, despacho y administración general."}
          </p>
        </div>

        <button
          className={styles.btnPrimary}
          onClick={() => setShowCreateModal(true)}
        >
          + Crear Nuevo Pedido
        </button>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Pedidos Totales</span>
          <span className={styles.metricValue}>{metrics.total}</span>
          <span className={styles.metricSubtitle}>Registrados</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Nuevos / Aceptados</span>
          <span className={styles.metricValue}>{metrics.creados}</span>
          <span className={styles.metricSubtitle}>Listos para preparación</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>En Ruta / Despacho</span>
          <span className={styles.metricValue}>{metrics.despachados}</span>
          <span className={styles.metricSubtitle}>En proceso operativo</span>
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
                  onClick={() => setActiveTab(tab)}
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
                  CAMBIAR ESTADO / ACCIONES
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
                    <td>{order.customerId}</td>
                    <td>
                      <span className={getStatusBadge(order.status)}>
                        {order.status}
                      </span>
                    </td>
                    <td className={styles.boldText}>
                      €{order.total.toFixed(2)}
                    </td>

                    <td className={styles.actionColumn}>
                      {isCliente && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className={styles.btnLink}
                            onClick={() =>
                              alert(
                                `Seguimiento del Pedido #${order.id}\nEstado: ${order.status}`,
                              )
                            }
                          >
                            Ver Seguimiento
                          </button>

                          {["CREADO", "PENDIENTE", "ACEPTADO"].includes(
                            order.status,
                          ) && (
                            <button
                              className={styles.btnDanger}
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      )}

                      {(isOperador || isAdmin) && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                          }}
                        >
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
                            <option value="CREADO">CREADO</option>
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="ACEPTADO">ACEPTADO</option>
                            <option value="EN_PREPARACIÓN">
                              EN PREPARACIÓN
                            </option>
                            <option value="EN_PROCESO">EN PROCESO</option>
                            <option
                              value="DESPACHADO"
                              disabled={
                                order.status === "CREADO" ||
                                order.status === "PENDIENTE"
                              }
                            >
                              DESPACHADO
                            </option>
                            <option value="ENTREGADO">ENTREGADO</option>
                            <option value="COMPLETADO">COMPLETADO</option>
                            <option value="CANCELADO">CANCELADO</option>
                          </select>

                          {isAdmin && (
                            <button
                              className={styles.btnDanger}
                              onClick={() => handleDeleteOrder(order.id)}
                              style={{ marginLeft: "0.5rem" }}
                            >
                              Eliminar
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
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Crear Nuevo Pedido</h3>
            <form onSubmit={handleCreateOrder}>
              <label>
                Monto Total (€):
                <input
                  type="number"
                  className={styles.searchInput}
                  style={{ width: "100%", marginTop: "0.5rem" }}
                  value={newOrderTotal}
                  onChange={(e) => setNewOrderTotal(Number(e.target.value))}
                  required
                />
              </label>
              <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                <button
                  type="button"
                  className={styles.tabButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  style={{ marginLeft: "0.5rem" }}
                >
                  Confirmar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
