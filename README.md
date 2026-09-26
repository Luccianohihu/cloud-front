# 🚀 Cloud Front

Cloud Front es una aplicación frontend moderna construida con React, TypeScript y Vite. Diseñada como una interfaz web escalable y responsive que integra autenticación segura a través de AWS Amplify, proporcionando una experiencia de usuario fluida con navegación intuitiva y componentes reutilizables.

La solución está pensada para operar de forma desacoplada con microservicios backend, manteniendo una arquitectura modular y orientada a componentes que facilita el mantenimiento, la escalabilidad y la evolución del código.

---

## 🏗️ Arquitectura general

El proyecto está estructurado siguiendo principios de arquitectura limpia y atomic design:

1. **Características principales:**
   - Autenticación segura integrada con AWS Amplify
   - Dashboard de control administrativo
   - Catálogo de productos interactivo
   - Gestión de órdenes y pedidos
   - Sistema de enrutamiento con React Router
   - Componentes reutilizables bajo patrón atomic design

2. **Capas de la aplicación:**
   - `features/` - Módulos de negocio independientes (login, catálogo, órdenes, dashboard)
   - `shared/` - Componentes, tokens de diseño y utilidades compartidas
   - `context/` - Contextos globales de React (autenticación, estado de la app)
   - `hooks/` - Hooks personalizados (UseApi para consumo de endpoints)

---

## 📁 Estructura del repositorio

```text
cloud-front/
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── .oxlintrc.json
├── .gitignore
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   ├── index.css
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── features/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── catalogo/
│   │   ├── oredenes/
│   │   ├── callback/
│   │   └── test/
│   ├── hooks/
│   │   └── UseApi.ts
│   └── shared/
│       └── ui/
│           ├── atomos/
│           ├── layout/
│           └── tokens/
└── package-lock.json
```

---

## 🧩 Tecnologías principales

- **React 19** - Librería UI moderna con arquitectura de componentes
- **TypeScript 6** - Tipado estático para mayor seguridad
- **Vite 8** - Bundler de desarrollo ultrarrápido
- **React Router 7** - Enrutamiento navegacional
- **AWS Amplify** - Autenticación y servicios backend
- **Lucide React** - Librería de iconos vectoriales
- **Oxlint** - Linter estricto para calidad de código
- **CSS Modules** - Estilos encapsulados a nivel de componente

---

## ⚙️ Requisitos previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- **Node.js** versión 16 o superior
- **npm** o **yarn** para gestión de dependencias
- **Git** para control de versiones
- Cuenta en **AWS** con configuración de Amplify (opcional para desarrollo local)

---

## ▶️ Cómo ejecutar localmente

### 1) Clonar el repositorio

```bash
git clone https://github.com/Luccianohihu/cloud-front.git
cd cloud-front
```

### 2) Instalar dependencias

```bash
npm install
```

### 3) Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` (puerto predeterminado de Vite).

### 4) Compilar para producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`.

### 5) Vista previa de producción

```bash
npm run preview
```

---

## 🧪 Calidad de código

### Ejecutar el linter

```bash
npm run lint
```

Oxlint verificará el código TypeScript y React en busca de errores y malas prácticas.

---

## 🎯 Características principales

### 🔐 Autenticación
- Integración con AWS Amplify para login seguro
- Página de callback para manejo de redirecciones OAuth
- Contexto global `AuthContext` para gestión de sesión

### 📊 Dashboard
- Panel de control administrativo
- Visualización de estadísticas y métricas
- Consumo de datos desde API backend

### 📦 Catálogo
- Visualización de productos disponibles
- Filtrado y búsqueda de artículos
- Integración con servicio de catálogo backend

### 🛒 Órdenes
- Gestión y seguimiento de pedidos
- Estados de transacción
- Historial de compras

### 🎨 Diseño UI
- Componentes atómicos reutilizables (botones, inputs, etc.)
- Sistema de tokens de diseño (colores, tipografía)
- Layout responsivo con sidebar navegable

---

## 🛡️ Principios de diseño

Este proyecto busca aplicar buenas prácticas de desarrollo frontend:

- **Componentes reutilizables** bajo patrón atomic design
- **Separación de responsabilidades** entre features, shared y context
- **Tipado fuerte** con TypeScript para prevenir errores
- **Arquitectura modular** que facilita testing y mantenimiento
- **Performance optimizado** con Vite y lazy loading
- **Seguridad** integrada con AWS Amplify y autenticación OAuth2

---

## 📌 Estado del proyecto

El repositorio presenta una base sólida para una aplicación frontend moderna y escalable. Actualmente se encuentra estructurado como una plataforma modular con características de autenticación, dashboard, catálogo y gestión de órdenes, listos para continuar ampliando funcionalidades, mejorando UX/UI y optimizando performance.

---

## 📎 Enlaces relevantes

- **Repositorio:** https://github.com/Luccianohihu/cloud-front
- **Documentación de Vite:** https://vite.dev
- **Documentación de React:** https://react.dev
- **AWS Amplify Docs:** https://docs.amplify.aws
