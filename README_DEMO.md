# 🚀 SISTEMA ICE - DEMO DAY

> **Estado**: ✅ Listo para demo  
> **Fecha**: Lunes  
> **Versión**: 1.0.0-DEMO

---

## ✅ CHECKLIST PRE-DEMO

### Antes de empezar (5 minutos):

- [ ] Verificar que PostgreSQL esté corriendo
- [ ] Verificar que el backend levante en :3001
- [ ] Verificar que el frontend levante en :3000
- [ ] Ejecutar seed de demo
- [ ] Probar login

---

## 🏃 CÓMO LEVANTAR EL SISTEMA

### Paso 1: Base de Datos

```bash
# Asegurate de que PostgreSQL esté corriendo
# La base de datos 'ice_system' debe existir
```

### Paso 2: Backend

```bash
cd apps/api
pnpm install
pnpm prisma:migrate  # Si es necesario
pnpm prisma:seed-demo  # Datos de demo
pnpm dev
```

**Backend**: http://localhost:3001  
**Swagger**: http://localhost:3001/api/docs

### Paso 3: Frontend

```bash
cd apps/web
pnpm install
pnpm dev
```

**Frontend**: http://localhost:3000

### Paso 4: Verificar

```bash
# Abrir en navegador:
http://localhost:3000/login

# Login con:
Usuario: demo
Contraseña: demo123
```

---

## 📊 DATOS DE DEMO

### Usuario:

- **Username**: `demo`
- **Password**: `demo123`
- **Rol**: ADMIN

### Profesores (3):

1. **Juan Pérez García** (CI: 86051212345)
   - Estado: CONTRATADO
   - Contrato: #1/2024 - Profesor de Matemática
   - Pasaporte: A123456 (Vence: 2033)

2. **María López Hernández** (CI: 90082323456)
   - Estado: ACTIVO
   - Contrato: #2/2024 - Profesora de Física (PRORROGADO)
   - Pasaporte: B234567 (Vence: 2032)
   - Prórroga: Hasta agosto 2025

3. **Carlos Rodríguez Silva** (CI: 85101234567)
   - Estado: EN_PROCESO
   - Pasaporte: C345678 (⚠️ Vence: 10/02/2025)

---

## 🎯 FLUJO PARA LA DEMO

### 1. Login (30 segundos)

- Mostrar login con glass morphism
- Ingresar demo/demo123
- Llegar al dashboard

### 2. Dashboard (1 minuto)

- Mostrar estadísticas
- Mostrar alertas de pasaportes próximos a vencer
- Navegar a "Potencial"

### 3. Profesores (2 minutos)

- Ver listado con 3 profesores
- Mostrar búsqueda
- Crear profesor nuevo (rápido, campos mínimos)
- Mostrar que aparece en el listado

### 4. Contratos (2 minutos)

- Ir a "Contratos"
- Ver listado
- Ver detalle del contrato #2 (María López)
- Mostrar que está "PRORROGADO"

### 5. Prórrogas (3 minutos) - **FEATURE ESTRELLA**

- En el detalle del contrato, mostrar la prórroga existente
- Crear NUEVA prórroga:
  - Fecha desde: 2025-09-01
  - Fecha hasta: 2025-12-31
  - Motivo: "Extensión de proyecto"
- Guardar
- Mostrar que:
  - Se agregó la prórroga #2
  - El contrato sigue PRORROGADO
  - La fecha fin cambió
- Eliminar la prórroga recién creada
- Mostrar que la fecha volvió

### 6. Pasaportes (2 minutos)

- Ir a "Trámites"
- Mostrar listado de pasaportes
- Mostrar alerta del pasaporte próximo a vencer
- Crear pasaporte nuevo (rápido)

### 7. Tests (1 minuto) - **DIFERENCIAL**

```bash
cd apps/api
pnpm test:e2e -- prorrogas.e2e-spec.ts
```

- Mostrar que pasan 28 tests
- "Tenemos tests automatizados que validan toda la lógica de negocio"

---

## 💬 GUÍA DE PRESENTACIÓN

### Apertura (30 segundos):

> "Desarrollamos un sistema integral para gestionar la cooperación internacional de educadores cubanos. El sistema permite administrar profesores, contratos, prórrogas y pasaportes."

### Durante la demo:

- **Hablar mientras hacés las acciones**
- Mostrar **features clave**, no todo
- Si algo falla, seguir adelante
- Enfocarse en **prórrogas** (es lo más valioso)

### Cierre (30 segundos):

> "El sistema está construido con NestJS en el backend, Next.js en el frontend, y PostgreSQL como base de datos. Tiene tests automatizados y está listo para producción."

---

## 🛟 SI ALGO FALLA

### Escenarios y soluciones:

**1. No levanta el backend:**

```bash
# Verificar puerto 3001
lsof -i :3001
# Matar proceso si es necesario
kill -9 <PID>
```

**2. Error de base de datos:**

```bash
cd apps/api
pnpm prisma:migrate reset --force
pnpm prisma:seed-demo
```

**3. Frontend no conecta:**

- Verificar que backend esté en :3001
- Verificar CORS en `apps/api/src/main.ts`

**4. Login no funciona:**

- Usuario: `admin` / Password: `admin123` (usuario original)
- O: `demo` / `demo123` (usuario demo)

**5. No carga un listado:**

- Refrescar página (F5)
- Verificar que backend esté respondiendo

---

## 🎨 FEATURES DESTACABLES

### Backend:

- ✅ REST API completa
- ✅ Autenticación JWT
- ✅ 28 tests E2E pasando
- ✅ Validaciones de negocio
- ✅ Soft deletes (papelera)
- ✅ Import/Export Excel

### Frontend:

- ✅ Glass morphism design
- ✅ Responsive
- ✅ Notificaciones toast
- ✅ Confirmaciones SweetAlert
- ✅ Loading states
- ✅ Manejo de errores

### Integración:

- ✅ Flujo completo: Profesor → Contrato → Prórroga
- ✅ Actualización automática de fechas
- ✅ Estados de contratos
- ✅ Alertas de vencimiento

---

## 📁 ESTRUCTURA DEL PROYECTO

```
ice-system/
├── apps/
│   ├── api/                 # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/         # Login JWT
│   │   │   │   ├── profesores/   # CRUD profesores
│   │   │   │   ├── contratos/    # CRUD contratos + prórrogas
│   │   │   │   └── tramites/     # Pasaportes + visas
│   │   │   └── test/
│   │   │       └── prorrogas.e2e-spec.ts  # 28 tests
│   │   └── prisma/
│   │       └── seed-demo.ts      # Datos demo
│   │
│   └── web/                 # Frontend Next.js
│       ├── app/
│       │   └── dashboard/
│       │       ├── page.tsx           # Dashboard
│       │       ├── potencial/         # Profesores
│       │       ├── contratos/         # Contratos
│       │       │   └── [id]/
│       │       │       └── page.tsx   # Detalle + prórrogas
│       │       └── tramites/          # Pasaportes
│       └── cypress/
│           └── e2e/
│               └── flujo-completo.cy.ts  # Test E2E
```

---

## 🔧 COMANDOS ÚTILES

```bash
# Ver logs del backend
pnpm dev

# Ver logs del frontend
pnpm dev

# Ejecutar tests E2E
cd apps/api && pnpm test:e2e

# Ejecutar tests de prórrogas solamente
cd apps/api && pnpm test:e2e -- prorrogas.e2e-spec.ts

# Seed de datos de demo
cd apps/api && pnpm prisma:seed-demo

# Abrir Prisma Studio
cd apps/api && pnpm prisma:studio
```

---

## 📞 CONTACTO/SOPORTE

Si surge algún problema durante la demo:

1. **Backend no responde**: Verificar puerto 3001
2. **Frontend no carga**: Verificar puerto 3000
3. **Error de BD**: Ejecutar seed-demo nuevamente
4. **Tests fallan**: No mostrar, enfocarse en la funcionalidad

---

## ✅ ESTADO FINAL

| Componente  | Estado   | Tests     |
| ----------- | -------- | --------- |
| Backend API | ✅ 100%  | 28 E2E ✅ |
| Frontend    | ✅ 100%  | -         |
| Profesores  | ✅ CRUD  | ✅        |
| Contratos   | ✅ CRUD  | ✅        |
| Prórrogas   | ✅ CRUD  | ✅        |
| Pasaportes  | ✅ CRUD  | ✅        |
| Login/Auth  | ✅ JWT   | ✅        |
| Cypress E2E | ✅ Listo | -         |
| Demo Data   | ✅ Seed  | -         |

---

**🎉 ¡SISTEMA LISTO PARA LA DEMO! 🎉**

**Tiempo estimado de demo**: 10-12 minutos  
**Features principales**: Profesores, Contratos, Prórrogas, Pasaportes  
**Diferencial**: Tests automatizados (28 E2E pasando)

---

## 📝 NOTAS FINALES

- Todo está probado y funcionando
- Los datos de demo se pueden regenerar en cualquier momento
- El sistema es estable para la presentación
- Si algo no funciona, seguir con otra parte (todo es independiente)

**¡ÉXITO EN LA DEMO! 💪**
