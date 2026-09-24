// src/features/dashboard/DashboardService.ts

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status:
    | "CREADO"
    | "ACEPTADO"
    | "EN_PREPARACIÓN"
    | "DESPACHADO"
    | "ENTREGADO"
    | "CANCELADO";
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

export interface OperadorMetrics {
  pendingCount: number;
  inPreparationCount: number;
  readyToShipCount: number;
  stockAlertsCount: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export interface AdminMetrics {
  totalSales: number;
  totalOrders: number;
  activeProductsCount: number;
  outOfStockCount: number;
  recentOrders: Order[];
  outOfStockProducts: Product[];
}

const ORDERS_URL = "http://localhost:8080/api/v1/orders";
const PRODUCTS_URL = "http://localhost:8080/api/v1/products";

const getHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const extractData = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error HTTP (${response.status}): ${errorText}`);
  }
  const json = await response.json();
  return (json.data !== undefined ? json.data : json) as T;
};

const mapToOrder = (raw: any): Order => ({
  id: String(raw.id),
  createdAt: raw.createdAt
    ? new Date(raw.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : new Date().toLocaleDateString("es-ES"),
  status: (raw.orderState || raw.status || "CREADO") as Order["status"],
  total: Number(raw.total || 0),
  customerId: String(raw.clientId || raw.customerId || "CLI-001"),
});

const mapToProduct = (raw: any): Product => ({
  id: String(raw.id),
  name: raw.name || "",
  price: Number(raw.price || 0),
  stock: Number(raw.stock || 0),
});

export const dashboardService = {
  // 1. Métricas para el Cliente
  getClienteMetrics: async (
    customerId: string,
    token?: string,
  ): Promise<ClienteMetrics> => {
    const res = await fetch(`${ORDERS_URL}?customerId=${customerId}`, {
      headers: getHeaders(token),
    });

    const rawOrders = await extractData<any[]>(res);
    const orders = rawOrders.map(mapToOrder);

    const deliveredOrders = orders.filter(
      (o) => o.status === "ENTREGADO",
    ).length;
    const inProgressOrders = orders.filter((o) =>
      ["CREADO", "ACEPTADO", "EN_PREPARACIÓN", "DESPACHADO"].includes(o.status),
    ).length;
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    const latestOrder = orders.length > 0 ? orders[0] : null;

    return {
      totalOrders: orders.length,
      inProgressOrders,
      deliveredOrders,
      totalSpent,
      latestOrder,
    };
  },

  // 2. Métricas para el Operador
  getOperadorMetrics: async (token?: string): Promise<OperadorMetrics> => {
    const [ordersRes, productsRes] = await Promise.all([
      fetch(ORDERS_URL, { headers: getHeaders(token) }),
      fetch(PRODUCTS_URL, { headers: getHeaders(token) }),
    ]);

    const rawOrders = await extractData<any[]>(ordersRes);
    const rawProducts = await extractData<any[]>(productsRes);

    const orders = rawOrders.map(mapToOrder);
    const products = rawProducts.map(mapToProduct);
    const lowStockProducts = products.filter((p) => p.stock < 5);

    return {
      pendingCount: orders.filter((o) => o.status === "CREADO").length,
      inPreparationCount: orders.filter((o) => o.status === "EN_PREPARACIÓN")
        .length,
      readyToShipCount: orders.filter((o) => o.status === "ACEPTADO").length,
      stockAlertsCount: lowStockProducts.length,
      recentOrders: orders.slice(0, 5),
      lowStockProducts: lowStockProducts.slice(0, 5),
    };
  },

  // 3. Métricas para el Administrador
  getAdminMetrics: async (token?: string): Promise<AdminMetrics> => {
    const [ordersRes, productsRes] = await Promise.all([
      fetch(ORDERS_URL, { headers: getHeaders(token) }),
      fetch(PRODUCTS_URL, { headers: getHeaders(token) }),
    ]);

    const rawOrders = await extractData<any[]>(ordersRes);
    const rawProducts = await extractData<any[]>(productsRes);

    const orders = rawOrders.map(mapToOrder);
    const products = rawProducts.map(mapToProduct);
    const outOfStockProducts = products.filter((p) => p.stock === 0);

    return {
      totalSales: orders.reduce((sum, o) => sum + o.total, 0),
      totalOrders: orders.length,
      activeProductsCount: products.length,
      outOfStockCount: outOfStockProducts.length,
      recentOrders: orders.slice(0, 5),
      outOfStockProducts: outOfStockProducts.slice(0, 5),
    };
  },
};
