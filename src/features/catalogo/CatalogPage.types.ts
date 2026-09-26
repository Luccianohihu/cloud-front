export type ProductCategory = "Todos" | "Calzado" | "Ropa" | "Accesorios";
export type ProductStatus = "Activo" | "Bajo Stock" | "Sin Stock";

export interface Product {
  id: string;
  name: string;
  category: Exclude<ProductCategory, "Todos">;
  price: number;
  stock: number;
  status: ProductStatus;
  imageUrl: string;
}
