import { API_BASE_URL } from "../../config/api";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: string;
  total: number;
  customerId: string;
}

export interface ClienteMetrics {
  totalOrders: number;
  inProgressOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  latestOrder: Order | null;
}

export interface GeneralSummary {
  totalOrders: number;
  statusCounts: Record<string, number>;
  pendingAcceptance: number;
  recentOrders: Order[];
}

export type OrderSummaryMetrics = Omit<GeneralSummary, "recentOrders">;

const API_BASE = API_BASE_URL;
const ORDERS_URL = `${API_BASE}/orders`;

const getHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const readData = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error HTTP (${response.status}): ${errorText}`);
  }
  const json = await response.json();
  return json?.data !== undefined ? json.data : json;
};

const readList = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const mapToOrder = (raw: any): Order => ({
  id: String(raw.id),
  createdAt: raw.createdAt
    ? new Date(raw.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "",
  status: String(raw.status || raw.orderState || "CREADO"),
  total: Number(raw.total || 0),
  customerId: String(raw.clientId || raw.customerId || "N/A"),
});

const fetchOrderSummaryMetrics = async (
  token?: string,
): Promise<OrderSummaryMetrics> => {
  const response = await fetch(`${ORDERS_URL}/dashboard/summary`, {
    headers: getHeaders(token),
  });
  const summary = await readData(response);
  const statusCounts = Object.fromEntries(
    Object.entries(summary.orderByStatus || summary.statusCounts || {}).map(([status, count]) => [
      status,
      Number(count),
    ]),
  );
  return {
    totalOrders: Number(summary.totalOrders || 0),
    statusCounts,
    pendingAcceptance: Number(summary.pendingAcceptance ?? statusCounts.CREADO ?? 0),
  };
};

export const dashboardService = {
  getOrderSummaryMetrics: fetchOrderSummaryMetrics,

  getClienteMetrics: async (token?: string): Promise<ClienteMetrics> => {
    const response = await fetch(`${ORDERS_URL}/me`, {
      headers: getHeaders(token),
    });
    const orders = readList(await readData(response)).map(mapToOrder);
    const deliveredOrders = orders.filter((order) => order.status === "ENTREGADO").length;
    const inProgressOrders = orders.filter((order) =>
      ["CREADO", "ACEPTADO", "EN_PREPARACION", "DESPACHADO"].includes(order.status),
    ).length;

    return {
      totalOrders: orders.length,
      inProgressOrders,
      deliveredOrders,
      totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
      latestOrder: orders[0] || null,
    };
  },

  getGeneralSummary: async (token?: string): Promise<GeneralSummary> => {
    const [summary, recentOrders] = await Promise.all([
      fetchOrderSummaryMetrics(token),
      fetch(`${ORDERS_URL}?page=0&size=5&sort=createdAt,desc`, {
        headers: getHeaders(token),
      }).then(readData),
    ]);
    return {
      ...summary,
      recentOrders: readList(recentOrders).map(mapToOrder),
    };
  },
};
