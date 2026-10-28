// src/features/catalogo/CatalogPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, ShoppingCart } from "lucide-react";
import { CustomButton } from "../../shared/ui/atomos/custom-button/CustomButton";
import { catalogService, type Category, type Product } from "./CatalogService";
import { orderService } from "../ordenes/OrderService";
import { useAuth } from "../../context/useAuth";
import styles from "./CatalogPage.module.css";

export const CatalogPage: React.FC = () => {
  const { token, role, login } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<string>("price-asc");
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);

  const isAdmin = role === "ADMINISTRADOR" || role === "ROLE_ADMINISTRADOR";
  const isOperator = role === "OPERADOR" || role === "ROLE_OPERADOR";
  const canManageProducts = isAdmin || isOperator;

  const categories = [{ id: "Todos", name: "Todos" }, ...categoryOptions];

 

const fetchCatalog = useCallback(async () => {
  try {
    const fetchedCategories = await catalogService.getCategories(token || undefined);
    setCategoryOptions(fetchedCategories);
    const categoryId = selectedCategoryId === "Todos" ? undefined : selectedCategoryId;
    const data = await catalogService.getProducts(token || undefined, categoryId, searchTerm);
    setProducts(data.map((product) => ({
      ...product,
      category: fetchedCategories.find((category) => category.id === product.categoryId)?.name || product.category,
    })));
    setError(null);
  } catch (error) {
    console.error("Error al cargar el catálogo:", error);
    setError("No se pudo cargar el catálogo. Intente nuevamente.");
  } finally {
    setLoading(false);
  }
}, [token, selectedCategoryId, searchTerm]);

useEffect(() => {
  void fetchCatalog();
}, [fetchCatalog]);

const promptForCategoryId = (defaultCategoryId?: string) => {
  if (categoryOptions.length === 0) {
    alert("No hay categorías disponibles. Cárguelas antes de continuar.");
    return null;
  }
  const options = categoryOptions.map((category, index) => `${index + 1}. ${category.name}`).join("\n");
  const defaultIndex = Math.max(0, categoryOptions.findIndex((category) => category.id === defaultCategoryId));
  const selection = prompt(`Seleccione una categoría indicando su número:\n${options}`, String(defaultIndex + 1));
  if (selection === null) return null;
  const category = categoryOptions[Number(selection) - 1];
  if (!category) {
    alert("La categoría seleccionada no es válida.");
    return null;
  }
  return category.id;
};



  const handleBuyProduct = async (product: Product) => {
    if (product.stock <= 0) {
      alert("El producto no tiene unidades disponibles.");
      return;
    }

    if (!token) {
      login("/catalogo");
      return;
    }

    const confirmPurchase = window.confirm(
      `¿Confirmar compra de "${product.name}" por €${product.price.toFixed(2)}?`,
    );

    if (!confirmPurchase) return;

    try {
      setBuyingProductId(product.id);
      await orderService.createOrder(
        {
          items: [{ productId: product.id, quantity: 1, unitPrice: product.price }],
        },
        token || undefined,
      );
      alert(`¡Compra realizada exitosamente! Se ha generado tu pedido.`);
      fetchCatalog();
    } catch (err) {
      console.error("Error al procesar compra:", err);
      alert("No se pudo procesar la compra. Intente más tarde.");
    } finally {
      setBuyingProductId(null);
    }
  };

  const handleAddProduct = async () => {
    if (!canManageProducts)
      return alert("No tienes permisos para crear productos");

    const name = prompt("Nombre del nuevo producto:");
    if (!name || !name.trim()) return;

    const defaultSku = name.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9_-]/g, "").slice(0, 50);
    const sku = prompt("SKU del producto (letras, números, guion o guion bajo):", defaultSku);
    if (sku === null || !sku.trim()) return;
    if (sku.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(sku.trim())) {
      alert("El SKU debe tener hasta 50 caracteres y solo puede contener letras, números, guiones o guiones bajos.");
      return;
    }

    const priceInput = prompt("Precio del producto (€):", "29.99");
    if (priceInput === null) return;
    const price = parseFloat(priceInput);

    const stockInput = prompt("Stock inicial del producto:", "10");
    if (stockInput === null) return;
    const stock = parseInt(stockInput, 10);
    const categoryId = promptForCategoryId();
    if (!categoryId) return;

    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      alert("Por favor, ingrese valores válidos.");
      return;
    }

    try {
      const newProduct = await catalogService.createProduct(
        {
          sku: sku.trim(),
          name: name.trim(),
          price,
          stock,
          categoryId,
        },
        token || undefined,
      );
      setProducts((prev) => [...prev, newProduct]);
      alert("Producto creado exitosamente.");
    } catch {
      alert("Error al intentar crear el producto.");
    }
  };

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
    const categoryId = promptForCategoryId(product.categoryId);
    if (!categoryId) return;

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
          categoryId,
        },
        token || undefined,
      );

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updatedProduct : p)),
      );
      alert("Producto actualizado exitosamente.");
    } catch {
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
    } catch  {
      alert("Error al intentar eliminar el producto.");
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        selectedCategoryId === "Todos" || product.categoryId === selectedCategoryId;
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
      case "Inactivo":
        return styles.badgeInactivo;
      default:
        return styles.badgeActivo;
    }
  };

  return (
    <main className={styles.mainContent}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Catálogo de Productos</h1>
          <p className={styles.subtitle}>
            Explora nuestros productos y realiza tus compras en línea.
          </p>
        </div>

        {canManageProducts && (
          <CustomButton variant="primary" onClick={handleAddProduct}>
            <Plus size={16} />
            Añadir Producto
          </CustomButton>
        )}
      </header>

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
                key={cat.id}
                className={
                  selectedCategoryId === cat.id
                    ? styles.activeChip
                    : styles.categoryChip
                }
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name}
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
  );
};
