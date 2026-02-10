# 📦 Organización de Librerías - ICE System

## Resumen de Dependencias

### 🏠 Root (`package.json`)

**Dev Dependencies:**

- `prettier` - Formateo de código
- `turbo` - Monorepo build system

---

### 🔧 API (`apps/api/package.json`)

#### **Dependencies (Runtime/Producción)**

| Librería             | Propósito              |
| -------------------- | ---------------------- |
| `@nestjs/*`          | Framework backend      |
| `@prisma/client`     | ORM database client    |
| `bcrypt`             | Hash de contraseñas    |
| `class-validator`    | Validación de DTOs     |
| `compression`        | Compresión HTTP        |
| `cookie-parser`      | Manejo de cookies      |
| `cors`               | CORS handling          |
| `csv-parse`          | Parseo de CSV          |
| `date-fns`           | Manipulación de fechas |
| `exceljs`            | Generación de Excel    |
| `express-rate-limit` | Rate limiting          |
| `handlebars`         | Templates HTML         |
| `helmet`             | Seguridad HTTP headers |
| `passport-jwt`       | Autenticación JWT      |
| `pdf-lib`            | Manipulación de PDFs   |
| `puppeteer`          | Generación de PDFs     |
| `reflect-metadata`   | Decoradores TypeScript |
| `rxjs`               | Programación reactiva  |
| `uuid`               | Generación de UUIDs    |
| `xlsx`               | Lectura de Excel       |
| `zod`                | Validación de schemas  |

#### **Dev Dependencies (Desarrollo/Testing)**

| Librería          | Propósito                  |
| ----------------- | -------------------------- |
| `@nestjs/cli`     | CLI de NestJS (build)      |
| `@nestjs/testing` | Testing framework          |
| `@types/*`        | Tipos TypeScript           |
| `eslint`          | Linter                     |
| `jest`            | Testing framework          |
| `prettier`        | Formateo                   |
| `prisma`          | CLI de Prisma (migrations) |
| `supertest`       | Testing HTTP               |
| `ts-*`            | TypeScript tooling         |
| `typescript`      | Compilador TS              |

---

### 🎨 Web (`apps/web/package.json`)

#### **Dependencies (Runtime/Producción)**

| Librería                   | Propósito                |
| -------------------------- | ------------------------ |
| `@hookform/resolvers`      | Validación formularios   |
| `@radix-ui/*`              | Componentes UI base      |
| `class-variance-authority` | Variantes de clases      |
| `clsx`                     | Utilidad de clases CSS   |
| `date-fns`                 | Fechas                   |
| `js-cookie`                | Manejo de cookies        |
| `jwt-decode`               | Decodificar JWT          |
| `lucide-react`             | Iconos                   |
| `next`                     | Framework React          |
| `next-themes`              | Temas oscuro/claro       |
| `react`                    | Framework UI             |
| `react-dom`                | DOM de React             |
| `react-hook-form`          | Formularios              |
| `react-hot-toast`          | Notificaciones           |
| `sweetalert2`              | Alertas modales          |
| `tailwind-merge`           | Merge de clases Tailwind |
| `tailwindcss-animate`      | Animaciones Tailwind     |
| `zod`                      | Validación schemas       |
| `zustand`                  | State management         |

#### **Dev Dependencies (Desarrollo/Testing)**

| Librería             | Propósito              |
| -------------------- | ---------------------- |
| `@types/*`           | Tipos TypeScript       |
| `autoprefixer`       | PostCSS plugin (build) |
| `cypress`            | E2E Testing            |
| `eslint`             | Linter                 |
| `eslint-config-next` | Config ESLint Next.js  |
| `postcss`            | CSS processing (build) |
| `tailwindcss`        | CSS framework (build)  |
| `typescript`         | Compilador TS          |

---

## 🐳 Optimización Docker

Los Dockerfiles están optimizados para:

1. **Etapa `deps-prod`**: Instala SOLO `dependencies` (sin dev)
2. **Etapa `builder`**: Instala TODAS las dependencias (para compilar)
3. **Etapa `runner`**: Copia solo el build y `dependencies`

### **Resultado:**

- Imagen de API: ~60% más pequeña (sin jest, supertest, eslint)
- Imagen de Web: ~50% más pequeña (sin cypress, eslint, tailwindcss en runtime)

---

## 📊 Tamaños Aproximados

### Antes (con todas las deps):

- API: ~800 MB
- Web: ~600 MB

### Después (solo producción):

- API: ~300 MB
- Web: ~250 MB

---

## ✅ Checklist de Organización

- [x] API: Separadas runtime vs dev dependencies
- [x] Web: Separadas runtime vs dev dependencies
- [x] Dockerfiles optimizados para producción
- [x] Cypress solo en dev (Web)
- [x] Jest/Supertest solo en dev (API)
- [x] ESLint/Prettier solo en dev
- [x] Prisma CLI solo en dev
- [x] Tailwind/Postcss en dev (solo build)

---

## 🚀 Comandos Útiles

```bash
# Ver dependencias de producción
pnpm list --prod

# Ver dependencias de desarrollo
pnpm list --dev

# Auditar vulnerabilidades
pnpm audit

# Actualizar dependencias
pnpm update

# Limpiar cache
pnpm store prune
```
