// src/components/CatalogPage.tsx

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { CustomButton } from "../../shared/ui/atomos/custom-button/CustomButton";
import type { ProductCategory } from "./CatalogPage.types";
import { catalogService, type Product } from "./CatalogService";
import { orderService } from "../oredenes/OrderService";
import { useAuth } from "../../context/AuthContext";
import styles from "./CatalogPage.module.css";

export const CatalogPage: React.FC = () => {
  // 1. Extraer token, role y datos del usuario desde Cognito
  const { token, role, user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<string>("price-asc");

  const isAdmin = role === "ADMINISTRADOR" || role === "ROLE_ADMINISTRADOR";
  const isOperator = role === "OPERADOR" || role === "ROLE_OPERADOR";
  const canManageProducts = isAdmin || isOperator;

  const categories: ProductCategory[] = [
    "Todos",
    "Calzado",
    "Ropa",
    "Accesorios",
  ];

  useEffect(() => {
    if (token) {
      fetchCatalog();
    }
  }, [token]);

  const fetchCatalog = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await catalogService.getProducts(token);
      setProducts(data);
    } catch (err: any) {
      setError("No se pudo cargar el catálogo. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Acción para ejecutar la compra de un producto
  const handleBuyProduct = async (product: Product) => {
    if (product.stock <= 0) {
      alert("El producto no tiene unidades disponibles.");
      return;
    }

    const customerId = user?.username || user?.id || "CLI-001";
    const confirmPurchase = window.confirm(
      `¿Confirmar compra de "${product.name}" por €${product.price.toFixed(2)}?`,
    );

    if (!confirmPurchase) return;

    try {
      setBuyingProductId(product.id);

      await orderService.createOrder(
        {
          customerId: customerId,
          total: product.price,
          items: [
            {
              productId: product.id,
              quantity: 1,
              price: product.price,
            },
          ],
        },
        token || undefined,
      );

      alert(`¡Compra realizada exitosamente! Se ha generado tu pedido.`);

      // Refrescamos el catálogo para actualizar el stock real desde el servidor
      fetchCatalog();
    } catch (err) {
      console.error("Error al procesar compra:", err);
      alert("No se pudo procesar la compra. Intente más tarde.");
    } finally {
      setBuyingProductId(null);
    }
  };

  // Permite agregar productos tanto a administradores como a operadores
  const handleAddProduct = async () => {
    if (!canManageProducts)
      return alert("No tienes permisos para crear productos");

    // 1. Nombre
    const name = prompt("Nombre del nuevo producto:");
    if (!name || !name.trim()) return;

    // 2. Precio
    const priceInput = prompt("Precio del producto (€):", "29.99");
    if (priceInput === null) return;
    const price = parseFloat(priceInput);

    // 3. Stock
    const stockInput = prompt("Stock inicial del producto:", "10");
    if (stockInput === null) return;
    const stock = parseInt(stockInput, 10);

    // Validaciones
    if (isNaN(price) || price < 0) {
      alert("Por favor, ingrese un precio numérico válido.");
      return;
    }

    if (isNaN(stock) || stock < 0) {
      alert("Por favor, ingrese un valor de stock válido.");
      return;
    }

    try {
      const newProduct = await catalogService.createProduct(
        {
          name: name.trim(),
          price,
          stock,
          categoryId: "6ab349854a8d5deb8a20c494",
          imageUrl:
            "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80",
        },
        token || undefined,
      );

      setProducts((prev) => [...prev, newProduct]);
      alert("Producto creado exitosamente.");
    } catch (err) {
      alert("Error al intentar crear el producto.");
    }
  };

  // Permite editar productos tanto a administradores como a operadores
  const handleEditProduct = async (product: Product) => {
    if (!canManageProducts)
      return alert("No tienes permisos para editar productos");

    const name = prompt("Nuevo nombre del producto:", product.name);
    if (name === null) return;

    const priceInput = prompt("Nuevo precio (€):", product.price.toString());
    if (priceInput === null) return;
    const price = parseFloat(priceInput);

    const stockInput = prompt(
      "Nuevo stock disponible:",
      product.stock.toString(),
    );
    if (stockInput === null) return;
    const stock = parseInt(stockInput, 10);

    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      alert("Por favor, ingrese valores válidos.");
      return;
    }

    try {
      const updatedProduct = await catalogService.updateProduct(
        product.id,
        {
          name: name.trim() || product.name,
          price,
          stock,
          categoryId: "6ab349854a8d5deb8a20c494",
        },
        token || undefined,
      );

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updatedProduct : p)),
      );

      alert("Producto actualizado exitosamente.");
    } catch (err) {
      alert("Error al intentar actualizar el producto.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin)
      return alert("Solo los administradores pueden eliminar productos");
    if (!confirm("¿Está seguro de que desea eliminar este producto?")) return;

    try {
      await catalogService.deleteProduct(id, token || undefined);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      alert("Error al intentar eliminar el producto.");
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        selectedCategory === "Todos" || product.category === selectedCategory;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === "price-asc") return a.price - b.price;
      if (sortOption === "price-desc") return b.price - a.price;
      if (sortOption === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const getStatusBadgeClass = (status: Product["status"]) => {
    switch (status) {
      case "Activo":
        return styles.badgeActivo;
      case "Bajo Stock":
        return styles.badgeBajoStock;
      case "Sin Stock":
        return styles.badgeSinStock;
      default:
        return styles.badgeActivo;
    }
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar */}
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
            alt="Usuario"
            className={styles.avatar}
          />
          <div>
            <p className={styles.userName}>
              {user?.username || "Usuario Activo"}
            </p>
            <p className={styles.userRole}>{role || "CLIENTE"}</p>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Catálogo de Productos</h1>
            <p className={styles.subtitle}>
              Explora nuestros productos y realiza tus compras en línea.
            </p>
          </div>

          {/* Botón visible para Administradores y Operadores */}
          {canManageProducts && (
            <CustomButton variant="primary" onClick={handleAddProduct}>
              <Plus size={16} />
              Añadir Producto
            </CustomButton>
          )}
        </header>

        {/* Toolbar */}
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

          <select
            className={styles.sortSelect}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="price-asc">Ordenar por: Menor precio</option>
            <option value="price-desc">Ordenar por: Mayor precio</option>
            <option value="name">Ordenar por: Nombre</option>
          </select>
        </div>

        {loading && <p>Cargando productos...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Grid de Productos */}
        {!loading && !error && (
          <div className={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <div key={product.id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/300"}
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
                      {/* Botón Comprar: Disponible para Clientes/Usuarios */}
                      <button
                        className={styles.buyButton}
                        disabled={
                          product.stock === 0 || buyingProductId === product.id
                        }
                        onClick={() => handleBuyProduct(product)}
                        title={
                          product.stock === 0 ? "Sin Stock" : "Comprar Ahora"
                        }
                      >
                        <ShoppingCart size={14} />
                        {buyingProductId === product.id
                          ? "Procesando..."
                          : "Comprar"}
                      </button>

                      {/* Botones de Gestión (Admin / Operador) */}
                      {canManageProducts && (
                        <button
                          className={styles.actionButton}
                          title="Editar"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          className={styles.actionButton}
                          title="Eliminar"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
