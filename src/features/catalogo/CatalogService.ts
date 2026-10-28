export interface Category {
  id: string;
  name: string;
}

export interface BackendProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status?: string;
  categoryId: string;
  category?: { id?: string; name: string } | string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  categoryId: string;
  price: number;
  stock: number;
  status: "Activo" | "Inactivo" | "Bajo Stock" | "Sin Stock";
  imageUrl: string;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  description?: string;
}

interface StandardResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8083/api/v1";
const PRODUCTS_URL = `${API_BASE}/products`;
const CATEGORIES_URL = `${API_BASE}/categories`;

const getHeaders = (token?: string): HeadersInit => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const readResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error HTTP (${response.status}): ${errorText}`);
  }
  const json = (await response.json()) as StandardResponse<T> | T;
  return (json && typeof json === "object" && "data" in json
    ? json.data
    : json) as T;
};

const mapToUIProduct = (
  item: BackendProduct,
  categoryName?: string,
): Product => {
  let status: Product["status"] = "Activo";
  if (item.status?.toUpperCase() === "INACTIVO") status = "Inactivo";
  else if (item.stock === 0) status = "Sin Stock";
  else if (item.stock < 5) status = "Bajo Stock";

  return {
    id: String(item.id),
    name: item.name,
    description: item.description,
    category:
      categoryName ||
      (typeof item.category === "object" && item.category !== null
        ? item.category.name
        : item.category) ||
      "General",
    categoryId:
      item.categoryId ||
      (typeof item.category === "object" ? item.category.id : undefined) ||
      "",
    price: Number(item.price),
    stock: Number(item.stock),
    status,
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
  };
};

export const catalogService = {
  getCategories: async (token?: string): Promise<Category[]> => {
    const response = await fetch(CATEGORIES_URL, {
      headers: getHeaders(token),
    });
    const data = await readResponse<Category[] | PageResponse<Category>>(response);
    return Array.isArray(data) ? data : data.content;
  },

  getProducts: async (
    token?: string,
    categoryId?: string,
    name?: string,
  ): Promise<Product[]> => {
    const query = new URLSearchParams({ page: "0", size: "20" });
    if (categoryId) query.set("categoryId", categoryId);
    if (name?.trim()) query.set("name", name.trim());

    const response = await fetch(`${PRODUCTS_URL}/search?${query}`, {
      headers: getHeaders(token),
    });
    const data = await readResponse<BackendProduct[] | PageResponse<BackendProduct>>(
      response,
    );
    const products = Array.isArray(data) ? data : data.content;
    return products.map((item) => mapToUIProduct(item));
  },

  getProductById: async (id: number | string, token?: string): Promise<Product> => {
    const response = await fetch(`${PRODUCTS_URL}/${id}`, {
      headers: getHeaders(token),
    });
    const data = await readResponse<BackendProduct>(response);
    return mapToUIProduct(data);
  },

  createProduct: async (
    productData: CreateProductPayload,
    token?: string,
  ): Promise<Product> => {
    const response = await fetch(PRODUCTS_URL, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(productData),
    });
    const data = await readResponse<BackendProduct>(response);
    return mapToUIProduct(data);
  },

  updateProduct: async (
    id: number | string,
    productData: Partial<CreateProductPayload>,
    token?: string,
  ): Promise<Product> => {
    const response = await fetch(`${PRODUCTS_URL}/${id}`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(productData),
    });
    const data = await readResponse<BackendProduct>(response);
    return mapToUIProduct(data);
  },

  deleteProduct: async (id: number | string, token?: string): Promise<void> => {
    const response = await fetch(`${PRODUCTS_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP (${response.status}): ${errorText}`);
    }
  },
};
