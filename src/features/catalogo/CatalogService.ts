// src/services/catalogService.ts

// 1. Estructura exacta que proviene del backend (ProductResponse.java)
export interface BackendProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?:
    | {
        id?: string;
        name: string;
      }
    | string;
}

// 2. Estructura consumida por la interfaz de usuario en React
export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  status: "Activo" | "Bajo Stock" | "Sin Stock";
  imageUrl: string;
}

// 3. Payload para crear/editar productos hacia el backend
export interface CreateProductPayload {
  name: string;
  price: number;
  stock: number;
  categoryId: string; // Requerido obligatoriamente por el backend
  category?: string;
  description?: string;
  imageUrl?: string;
}

// Estructura wrapper del backend (StandardResponse.java)
interface StandardResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const BASE_URL = `${API_BASE}/api/v1/products`;

const getHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Mapeador: Transforma BackendProduct -> Product para React
const mapToUIProduct = (item: BackendProduct): Product => {
  // Extrae el nombre de la categoría ya sea objeto o string
  const categoryName =
    typeof item.category === "object" && item.category !== null
      ? item.category.name
      : (item.category as string) || "General";

  // Determina el estado dinámicamente según el inventario
  let status: Product["status"] = "Activo";
  if (item.stock === 0) {
    status = "Sin Stock";
  } else if (item.stock < 5) {
    status = "Bajo Stock";
  }

  return {
    id: String(item.id),
    name: item.name,
    description: item.description,
    category: categoryName,
    price: item.price,
    stock: item.stock,
    status,
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
  };
};

export const catalogService = {
  // GET /api/v1/products
  getProducts: async (token?: string): Promise<Product[]> => {
    const res = await fetch(BASE_URL, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Error al obtener productos");

    const json: StandardResponse<BackendProduct[]> | BackendProduct[] =
      await res.json();
    const rawList: BackendProduct[] = "data" in json ? json.data : json;

    return rawList.map(mapToUIProduct);
  },

  // GET /api/v1/products/{id}
  getProductById: async (
    id: number | string,
    token?: string,
  ): Promise<Product> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Producto no encontrado");

    const json: StandardResponse<BackendProduct> | BackendProduct =
      await res.json();
    const rawProduct: BackendProduct = "data" in json ? json.data : json;

    return mapToUIProduct(rawProduct);
  },

  // POST /api/v1/products
  createProduct: async (
    productData: CreateProductPayload,
    token?: string,
  ): Promise<Product> => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error("Error al crear producto");

    const json: StandardResponse<BackendProduct> | BackendProduct =
      await res.json();
    const rawProduct: BackendProduct = "data" in json ? json.data : json;

    return mapToUIProduct(rawProduct);
  },

  // PUT /api/v1/products/{id}
  updateProduct: async (
    id: number | string,
    productData: Partial<CreateProductPayload>,
    token?: string,
  ): Promise<Product> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error("Error al actualizar producto");

    const json: StandardResponse<BackendProduct> | BackendProduct =
      await res.json();
    const rawProduct: BackendProduct = "data" in json ? json.data : json;

    return mapToUIProduct(rawProduct);
  },

  // DELETE /api/v1/products/{id}
  deleteProduct: async (id: number | string, token?: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error("Error al eliminar producto");
  },
};
