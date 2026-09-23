// src/components/OrdersDashboard.tsx

import React, { useState, useEffect, useMemo } from "react";

import styles from "./OrderDashboard.module.css";
import { orderService, type Order, type OrderStatus } from "./OrderService";

export type UserRole = "ROLE_CLIENTE" | "ROLE_OPERADOR" | "ROLE_ADMINISTRADOR";

interface OrdersDashboardProps {
  userRole: UserRole;
  userId: string;
  accessToken?: string;
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  userRole,
  userId,
  accessToken,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("TODOS");

  const isCliente = userRole === "ROLE_CLIENTE";
  const isOperador = userRole === "ROLE_OPERADOR";
  const isAdmin = userRole === "ROLE_ADMINISTRADOR";

  // Cargar pedidos según el rol al montar el componente
  useEffect(() => {
    fetchOrders();
  }, [userRole, userId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let data: Order[] = [];
      if (isCliente) {
        data = await orderService.getOrdersByCustomer(userId, accessToken);
      } else {
        data = await orderService.getAllOrders(accessToken);
      }
      setOrders(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculo dinámico de métricas KPI
  const metrics = useMemo(() => {
    return {
      total: orders.length,
      shipped: orders.filter(
        (o) =>
          o.shippingStatus === "ENVIADO" || o.shippingStatus === "EN_PROCESO",
      ).length,
      delivered: orders.filter(
        (o) => o.status === "COMPLETADO" || o.status === "ENTREGADO",
      ).length,
      cancelled: orders.filter((o) => o.status === "CANCELADO").length,
    };
  }, [orders]);

  // Filtrado de lista por tab y término de búsqueda
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.createdAt.includes(searchTerm);

      const matchesTab =
        activeTab === "TODOS" ||
        (activeTab === "PENDIENTES" &&
          (order.status === "PENDIENTE" || order.status === "PREPARANDO")) ||
        (activeTab === "ENVIADOS" && order.shippingStatus === "ENVIADO") ||
        (activeTab === "ENTREGADOS" &&
          (order.status === "ENTREGADO" || order.status === "COMPLETADO"));

      return matchesSearch && matchesTab;
    });
  }, [orders, searchTerm, activeTab]);

  // Acción de Operador: Cambiar Estado (PUT)
  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        newStatus,
        accessToken,
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: updatedOrder.status } : o,
        ),
      );
    } catch (error) {
      alert("No se pudo actualizar el estado del pedido.");
    }
  };

  // Acción de Admin: Eliminar Pedido (DELETE)
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el pedido #${orderId}?`))
      return;

    try {
      await orderService.deleteOrder(orderId, accessToken);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      alert("Error al intentar eliminar el pedido.");
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PREPARANDO":
      case "PENDIENTE":
        return styles.badgeWarning;
      case "COMPLETADO":
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
      {/* Encabezado */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {isCliente ? "Mis Pedidos" : "Gestión de Pedidos"}
          </h1>
          <p className={styles.subtitle}>
            {isCliente
              ? "Revisa tus compras recientes, seguimiento y detalles de entrega."
              : "Administra, cambia estados y elimina registros según el nivel de acceso."}
          </p>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Pedidos Totales</span>
          <span className={styles.metricValue}>{metrics.total}</span>
          <span className={styles.metricSubtitle}>
            Registrados en el sistema
          </span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Enviados</span>
          <span className={styles.metricValue}>{metrics.shipped}</span>
          <span className={styles.metricSubtitle}>
            Puedes ver el seguimiento
          </span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Entregados</span>
          <span className={styles.metricValue}>{metrics.delivered}</span>
          <span className={styles.metricSubtitle}>Completados con éxito</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Cancelados</span>
          <span className={styles.metricValue}>{metrics.cancelled}</span>
          <span className={styles.metricSubtitle}>
            Sin incidencias recientes
          </span>
        </div>
      </div>

      {/* Sección Principal con Filtros y Tabla */}
      <div className={styles.sectionCard}>
        <div className={styles.filterBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar pedido o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className={styles.tabs}>
            {["TODOS", "PENDIENTES", "ENVIADOS", "ENTREGADOS"].map((tab) => (
              <button
                key={tab}
                className={
                  activeTab === tab ? styles.tabActive : styles.tabButton
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className={styles.loadingText}>Cargando pedidos...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID PEDIDO</th>
                <th>FECHA</th>
                <th>ESTADO</th>
                <th>ENVÍO</th>
                <th>TOTAL</th>
                <th style={{ textAlign: "right" }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.boldText}>#{order.id}</td>
                  <td>{order.createdAt}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span className={styles.badgeInfo}>
                      {order.shippingStatus}
                    </span>
                  </td>
                  <td className={styles.boldText}>€{order.total.toFixed(2)}</td>

                  {/* Columna de Acciones Diferenciadas */}
                  <td className={styles.actionColumn}>
                    {/* CLIENTE: Solo consultar detalle */}
                    {isCliente && (
                      <button
                        className={styles.btnLink}
                        onClick={() => alert(`Detalle #${order.id}`)}
                      >
                        Ver detalle
                      </button>
                    )}

                    {/* OPERADOR: Cambiar Estado */}
                    {isOperador && (
                      <select
                        className={styles.statusSelect}
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus,
                          )
                        }
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="PREPARANDO">PREPARANDO</option>
                        <option value="DESPACHADO">DESPACHADO</option>
                        <option value="ENTREGADO">ENTREGADO</option>
                        <option value="CANCELADO">CANCELADO</option>
                      </select>
                    )}

                    {/* ADMINISTRADOR: Eliminar Pedido */}
                    {isAdmin && (
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
