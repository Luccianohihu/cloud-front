import React, { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
} from "lucide-react";
import { CustomButton } from "../../shared/ui/atomos/custom-button/CustomButton";
import type { Product, ProductCategory } from "./CatalogPage.types";
import styles from "./CatalogPage.module.css";

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Sudadera Minimalista Aura",
    category: "Ropa",
    price: 39.99,
    stock: 12,
    status: "Activo",
    imageUrl:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80",
  },
  {
    id: "2",
    name: "Zapato Oxford Cuero",
    category: "Calzado",
    price: 120.0,
    stock: 3,
    status: "Bajo Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500&q=80",
  },
  {
    id: "3",
    name: "Bolso de Mano Elegance",
    category: "Accesorios",
    price: 85.0,
    stock: 0,
    status: "Sin Stock",
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80",
  },
  {
    id: "4",
    name: "Camiseta de Algodón Orgánico",
    category: "Ropa",
    price: 24.99,
    stock: 45,
    status: "Activo",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
  },
  {
    id: "5",
    name: "Gafas de Sol Horizon",
    category: "Accesorios",
    price: 59.0,
    stock: 18,
    status: "Activo",
    imageUrl:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80",
  },
  {
    id: "6",
    name: "Reloj Minimalista Slate",
    category: "Accesorios",
    price: 145.0,
    stock: 7,
    status: "Activo",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
  },
];

export const CatalogPage: React.FC = () => {
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const categories: ProductCategory[] = [
    "Todos",
    "Calzado",
    "Ropa",
    "Accesorios",
  ];

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "Todos" || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadgeClass = (status: Product["status"]) => {
    switch (status) {
      case "Activo":
        return styles.badgeActivo;
      case "Bajo Stock":
        return styles.badgeBajoStock;
      case "Sin Stock":
        return styles.badgeSinStock;
    }
  };

  return (
    <div className={styles.layoutContainer}>
      {/* 1. Sidebar de Navegación */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>A</div>
            <div>
              <div className={styles.brandTitle}>AURA</div>
              <div className={styles.brandSubtitle}>E-COMMERCE</div>
            </div>
          </div>

          <nav className={styles.navList}>
            <button className={styles.navItem}>
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button className={styles.navItem}>
              <ShoppingBag size={18} />
              Pedidos
            </button>
            <button className={styles.activeNavItem}>
              <Boxes size={18} />
              Catálogo
            </button>
          </nav>
        </div>

        <div className={styles.userProfile}>
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
            alt="Mateo Silva"
            className={styles.avatar}
          />
          <div>
            <p className={styles.userName}>Mateo Silva</p>
            <p className={styles.userRole}>Administrador</p>
          </div>
        </div>
      </aside>

      {/* 2. Contenido Principal */}
      <main className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Catálogo de Productos</h1>
            <p className={styles.subtitle}>
              Administra el inventario de la tienda, descripciones y precios.
            </p>
          </div>
          <CustomButton
            variant="primary"
            onClick={() =>
              console.log("Añadir producto (POST /api/v1/products)")
            }
          >
            <Plus size={16} />
            Añadir Producto
          </CustomButton>
        </header>

        {/* Toolbar: Filtros y Búsqueda */}
        <div className={styles.toolbar}>
          <div className={styles.searchAndCategories}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar productos..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.categories}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={
                    selectedCategory === cat
                      ? styles.activeChip
                      : styles.categoryChip
                  }
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <select className={styles.sortSelect}>
            <option>Ordenar por: Menor precio</option>
            <option>Ordenar por: Mayor precio</option>
            <option>Ordenar por: Nombre</option>
          </select>
        </div>

        {/* Grid de Productos */}
        <div className={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={styles.productImage}
                />
              </div>

              <div className={styles.cardBody}>
                <div className={styles.productHeader}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <span className={styles.productCategory}>
                    {product.category}
                  </span>
                </div>

                <div className={styles.priceAndStatus}>
                  <span className={styles.price}>
                    €{product.price.toFixed(2)}
                  </span>
                  <span className={getStatusBadgeClass(product.status)}>
                    {product.status}
                  </span>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.stock}>
                    Stock: {product.stock} unidades
                  </span>
                  <div className={styles.actions}>
                    <button className={styles.actionButton} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className={styles.actionButton} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
