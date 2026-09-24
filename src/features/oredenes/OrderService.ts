// src/services/OrderService.ts

export type OrderStatus =
  | "CREADO"
  | "ACEPTADO"
  | "EN_PREPARACIÓN"
  | "DESPACHADO"
  | "ENTREGADO"
  | "CANCELADO"
  | "PENDIENTE"
  | "EN_PROCESO"
  | "COMPLETADO";

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

export interface CreateOrderPayload {
  customerId: string;
  items: OrderItem[];
  total: number;
}

const BASE_URL = "http://localhost:8080/api/v1/orders";

const getHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/**
 * Extrae la propiedad 'data' del envoltorio StandardResponse<T> de Spring Boot
 */
const extractData = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Error en la solicitud HTTP (${response.status}): ${errorText}`,
    );
  }
  const json = await response.json();
  return (json.data !== undefined ? json.data : json) as T;
};

/**
 * Mapea los atributos enviados por Java (clientId, orderState, unitPrice)
 * a la estructura esperada en el Frontend (customerId, status, price)
 */
const mapToFrontendOrder = (rawOrder: any): Order => {
  return {
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
    status: (rawOrder.orderState || rawOrder.status || "CREADO") as OrderStatus,
    total: Number(rawOrder.total || 0),
    customerId: String(rawOrder.clientId || rawOrder.customerId || "N/A"),
    items: (rawOrder.items || []).map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.unitPrice ?? item.price ?? 0,
      subtotal: item.subtotal ?? item.quantity * (item.unitPrice || 0),
    })),
  };
};

export const orderService = {
  // 1. Obtener todos los pedidos (Operador y Administrador)
  getAllOrders: async (token?: string): Promise<Order[]> => {
    const response = await fetch(BASE_URL, { headers: getHeaders(token) });
    const rawList = await extractData<any[]>(response);
    return rawList.map(mapToFrontendOrder);
  },

  // 2. Obtener pedidos por cliente específico (Cliente)
  getOrdersByCustomer: async (
    customerId: string,
    token?: string,
  ): Promise<Order[]> => {
    const response = await fetch(`${BASE_URL}?customerId=${customerId}`, {
      headers: getHeaders(token),
    });
    const rawList = await extractData<any[]>(response);
    return rawList.map(mapToFrontendOrder);
  },

  // 3. Obtener un pedido por ID
  getOrderById: async (orderId: string, token?: string): Promise<Order> => {
    const response = await fetch(`${BASE_URL}/${orderId}`, {
      headers: getHeaders(token),
    });
    const rawOrder = await extractData<any>(response);
    return mapToFrontendOrder(rawOrder);
  },

  // 4. Crear un nuevo pedido (Adapta payload a OrderRequest.java)
  createOrder: async (
    payload: CreateOrderPayload,
    token?: string,
  ): Promise<Order> => {
    const springPayload = {
      clientId: payload.customerId,
      items: payload.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price ?? item.unitPrice ?? 0,
      })),
    };

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(springPayload),
    });

    const rawCreated = await extractData<any>(response);
    return mapToFrontendOrder(rawCreated);
  },

  // 5. Actualizar estado del pedido (Adapta cuerpo a OrderStatusUpdateRequest.java)
  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus,
    token?: string,
  ): Promise<Order> => {
    const response = await fetch(`${BASE_URL}/${orderId}/status`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify({
        status: status,
        orderState: status,
      }),
    });

    const rawUpdated = await extractData<any>(response);
    return mapToFrontendOrder(rawUpdated);
  },

  // 6. Eliminar pedido (Exclusivo Administrador)
  deleteOrder: async (orderId: string, token?: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${orderId}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Error al intentar eliminar la orden #${orderId}`);
    }
  },
};
