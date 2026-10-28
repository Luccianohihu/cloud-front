import { API_BASE_URL } from "../../config/api";

export type OrderStatus =
  | "CREADO"
  | "ACEPTADO"
  | "EN_PREPARACION"
  | "DESPACHADO"
  | "ENTREGADO"
  | "CANCELADO";

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  subtotal?: number;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  customerId: string;
  items?: OrderItem[];
}

export interface OrderPage {
  content: Order[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface CreateOrderPayload {
  items: OrderItem[];
}

const API_BASE = API_BASE_URL;
const BASE_URL = `${API_BASE}/orders`;

const getHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const extractData = async <T>(
  response: Response,
  unwrapContent = true,
): Promise<T> => {
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error HTTP (${response.status}): ${errorText}`);
  }
  const json = await response.json();
  const payload = json?.data !== undefined ? json.data : json;
  if (unwrapContent && Array.isArray(payload?.content)) {
    return payload.content as T;
  }
  return payload as T;
};

const mapToFrontendOrder = (rawOrder: any): Order => ({
  id: String(rawOrder.id),
  createdAt: rawOrder.createdAt
    ? new Date(rawOrder.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("es-ES"),
  status: (rawOrder.status || rawOrder.orderState || "CREADO") as OrderStatus,
  total: Number(rawOrder.total || 0),
  customerId: String(rawOrder.clientId || rawOrder.customerId || "N/A"),
  items: (rawOrder.items || []).map((item: any) => ({
    productId: String(item.productId),
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice ?? item.price ?? 0),
    subtotal: Number(item.subtotal ?? item.quantity * (item.unitPrice || 0)),
  })),
});

const getOrderList = async (response: Response): Promise<Order[]> => {
  const data = await extractData<any>(response);
  if (!Array.isArray(data)) return [];
  return data.map(mapToFrontendOrder);
};

export const orderService = {
  getOrdersPage: async (
    token: string | undefined,
    page = 0,
    size = 10,
    status?: OrderStatus,
  ): Promise<OrderPage> => {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: "createdAt,desc",
    });
    if (status) query.set("status", status);
    const response = await fetch(`${BASE_URL}?${query}`, {
      headers: getHeaders(token),
    });
    const data = await extractData<any>(response, false);
    if (Array.isArray(data)) {
      return {
        content: data.map(mapToFrontendOrder),
        page,
        size,
        totalElements: data.length,
        totalPages: 1,
        last: true,
      };
    }
    return {
      content: Array.isArray(data?.content)
        ? data.content.map(mapToFrontendOrder)
        : [],
      // The BFF wraps Spring page metadata as { content, page: { number, ... } }.
      page: Number(data?.page?.number ?? data?.page ?? page),
      size: Number(data?.page?.size ?? data?.size ?? size),
      totalElements: Number(data?.page?.totalElements ?? data?.totalElements ?? 0),
      totalPages: Number(data?.page?.totalPages ?? data?.totalPages ?? 0),
      last: Boolean(data?.page?.number != null
        ? Number(data.page.number) + 1 >= Number(data.page.totalPages)
        : data?.last),
    };
  },

  getAllOrders: async (token?: string, status?: OrderStatus): Promise<Order[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await fetch(`${BASE_URL}${query}`, {
      headers: getHeaders(token),
    });
    return getOrderList(response);
  },

  getOrdersByCustomer: async (token?: string): Promise<Order[]> => {
    const response = await fetch(`${BASE_URL}/me`, {
      headers: getHeaders(token),
    });
    return getOrderList(response);
  },

  getOrderById: async (orderId: string, token?: string): Promise<Order> => {
    const response = await fetch(`${BASE_URL}/${orderId}`, {
      headers: getHeaders(token),
    });
    return mapToFrontendOrder(await extractData<any>(response));
  },

  createOrder: async (
    payload: CreateOrderPayload,
    token?: string,
  ): Promise<Order> => {
    const body = {
      items: payload.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(body),
    });
    return mapToFrontendOrder(await extractData<any>(response));
  },

  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus,
    token?: string,
  ): Promise<Order> => {
    const response = await fetch(`${BASE_URL}/${orderId}/status`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify({ status }),
    });
    return mapToFrontendOrder(await extractData<any>(response));
  },

  acceptOrder: async (orderId: string, token?: string): Promise<Order | null> => {
    const response = await fetch(`${BASE_URL}/${orderId}/accept`, {
      method: "PATCH",
      headers: getHeaders(token),
    });
    const data = await extractData<any>(response);
    return data ? mapToFrontendOrder(data) : null;
  },

  cancelOrder: async (orderId: string, token?: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${orderId}/cancel`, {
      method: "PATCH",
      headers: getHeaders(token),
    });
    await extractData<unknown>(response);
  },
};
