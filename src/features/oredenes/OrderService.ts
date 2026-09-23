export type OrderStatus =
  | "PENDIENTE"
  | "PREPARANDO"
  | "DESPACHADO"
  | "COMPLETADO"
  | "ENTREGADO"
  | "CANCELADO";
export type ShippingStatus =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  shippingStatus: ShippingStatus;
  total: number;
  customerId: string;
}

const BASE_URL = "https://api.tu-dominio.com/api/v1/orders";

const getHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const orderService = {
  // Obtener todos los pedidos (Operador y Admin)
  getAllOrders: async (token?: string): Promise<Order[]> => {
    const response = await fetch(BASE_URL, { headers: getHeaders(token) });
    if (!response.ok) throw new Error("Error al obtener los pedidos");
    return response.json();
  },

  // Obtener pedidos por cliente específico (Cliente)
  getOrdersByCustomer: async (
    customerId: string,
    token?: string,
  ): Promise<Order[]> => {
    const response = await fetch(`${BASE_URL}?customerId=${customerId}`, {
      headers: getHeaders(token),
    });
    if (!response.ok)
      throw new Error("Error al obtener los pedidos del cliente");
    return response.json();
  },

  // Actualizar estado del pedido (Operador)
  updateOrderStatus: async (
    orderId: string,
    status: string,
    token?: string,
  ): Promise<Order> => {
    const response = await fetch(`${BASE_URL}/${orderId}/status`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Error al actualizar el estado");
    return response.json();
  },

  // Eliminar pedido (Administrador)
  deleteOrder: async (orderId: string, token?: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${orderId}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error("Error al eliminar el pedido");
  },
};
