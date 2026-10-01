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

// Métricas exclusivas del cliente
export interface ClienteMetrics {
  totalOrders: number;
  inProgressOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  latestOrder: Order | null;
}

// Resumen general compartido entre Operador y Admin
export interface GeneralSummary {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const ORDERS_URL = `${API_BASE}/api/v1/orders`;
const PRODUCTS_URL = `${API_BASE}/api/v1/products`;

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
  if (Array.isArray(json)) return json as unknown as T;
  if (Array.isArray(json.content)) return json.content as unknown as T;
  if (Array.isArray(json.data)) return json.data as unknown as T;
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
  status: String(raw.orderState || raw.status || "CREADO"),
  total: Number(raw.total || 0),
  customerId: String(raw.clientId || raw.customerId || "N/A"),
});

const mapToProduct = (raw: any): Product => ({
  id: String(raw.id),
  name: raw.name || "Producto sin nombre",
  price: Number(raw.price || 0),
  stock: Number(raw.stock || 0),
});

export const dashboardService = {
  // 1. Obtiene las métricas individuales del Cliente
  getClienteMetrics: async (
    customerId?: string,
    token?: string,
  ): Promise<ClienteMetrics> => {
    const query =
      customerId && customerId !== "CLI-UNKNOWN"
        ? `?customerId=${customerId}`
        : "";

    const res = await fetch(`${ORDERS_URL}${query}`, {
      headers: getHeaders(token),
    });

    const rawOrders = await extractData<any[]>(res);
    const list = Array.isArray(rawOrders) ? rawOrders : [];
    const orders = list.map(mapToOrder);

    const deliveredOrders = orders.filter(
      (o) => o.status === "ENTREGADO",
    ).length;
    const inProgressOrders = orders.filter((o) =>
      [
        "CREADO",
        "ACEPTADO",
        "EN_PREPARACIÓN",
        "EN_PREPARACION",
        "DESPACHADO",
      ].includes(o.status),
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

  // 2. Resumen general para Admin y Operador
  getGeneralSummary: async (token?: string): Promise<GeneralSummary> => {
    const [ordersRes, productsRes] = await Promise.all([
      fetch(`${ORDERS_URL}/all`, { headers: getHeaders(token) }).catch(
        () => null,
      ),
      fetch(PRODUCTS_URL, { headers: getHeaders(token) }).catch(() => null),
    ]);

    let orders: Order[] = [];
    if (ordersRes && ordersRes.ok) {
      const rawOrders = await extractData<any[]>(ordersRes);
      const list = Array.isArray(rawOrders) ? rawOrders : [];
      orders = list.map(mapToOrder);
    }

    let products: Product[] = [];
    if (productsRes && productsRes.ok) {
      const rawProducts = await extractData<any[]>(productsRes);
      const list = Array.isArray(rawProducts) ? rawProducts : [];
      products = list.map(mapToProduct);
    }

    const lowStockProducts = products.filter((p) => p.stock < 5);

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) =>
        ["CREADO", "ACEPTADO", "EN_PREPARACIÓN", "EN_PREPARACION"].includes(
          o.status,
        ),
      ).length,
      deliveredOrders: orders.filter((o) => o.status === "ENTREGADO").length,
      recentOrders: orders.slice(0, 5),
      lowStockProducts: lowStockProducts.slice(0, 5),
    };
  },
};
