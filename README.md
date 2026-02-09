# Sistema ICE - Cooperación Internacional de Educadores

Sistema empresarial full-stack para la gestión de cooperación internacional de educadores. Construido con NestJS, Next.js, Prisma y PostgreSQL.

## 🏗️ Arquitectura

```
ice-system/
├── apps/
│   ├── api/                 # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/     # Módulos por dominio
│   │   │   │   ├── auth/         # Autenticación JWT
│   │   │   │   ├── profesores/   # Gestión de profesores
│   │   │   │   ├── tramites/     # Pasaportes y visas
│   │   │   │   ├── contratos/    # Contratos y prórrogas
│   │   │   │   └── nomencladores/# Provincias, municipios, etc.
│   │   │   ├── common/      # Guards, filters, utils
│   │   │   ├── config/      # Configuración
│   │   │   └── database/    # Prisma service
│   │   └── prisma/
│   │       ├── schema.prisma    # Esquema de BD
│   │       └── seed.ts          # Datos iniciales
│   └── web/                    # Frontend Next.js
│       ├── app/                # App Router
│       │   ├── dashboard/      # Dashboard y módulos
│       │   └── login/          # Página de login
│       ├── components/         # Componentes React
│       ├── services/           # Servicios API
│       ├── store/              # Estado global (Zustand)
│       └── types/              # Tipos TypeScript
├── docker-compose.yml          # Orquestación Docker
├── pnpm-workspace.yaml         # Configuración pnpm workspace
├── package.json               # Configuración del monorepo
└── README.md                  # Documentación
```

## 🚀 Inicio Rápido

### Opción 1: Docker Compose (Recomendado)

```bash
# 1. Clonar el repositorio
cd ice-system

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar todos los servicios
docker-compose up -d

# 4. Ejecutar migraciones y seed
docker-compose exec api npx prisma migrate dev
docker-compose exec api npx prisma db seed
```

La aplicación estará disponible en:

- **Web**: http://localhost:3000
- **API**: http://localhost:3001/api/v1
- **Documentación API**: http://localhost:3001/api/docs

### Opción 2: Desarrollo Local con pnpm

#### Requisitos

- Node.js 20+
- PostgreSQL 16
- pnpm 9+

#### Instalación

```bash
# 1. Instalar dependencias en todo el monorepo
pnpm install

# 2. Configurar variables de entorno del backend
cd apps/api
cp .env.example .env
# Editar .env con la configuración de PostgreSQL

# 3. Generar cliente Prisma y ejecutar migraciones
cd apps/api
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# 4. Configurar variables de entorno del frontend
cd apps/web
cp .env.example .env.local

# 5. Iniciar servicios de desarrollo
# Terminal 1 - Backend
cd apps/api
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

## 📋 Credenciales de Prueba

| Usuario  | Contraseña  | Rol      |
| -------- | ----------- | -------- |
| admin    | admin123    | ADMIN    |
| operador | operador123 | OPERADOR |
| consulta | consulta123 | CONSULTA |

## 🗄️ Estructura de la Base de Datos

### Entidades Principales

- **Usuario**: Usuarios del sistema con roles (ADMIN, OPERADOR, CONSULTA)
- **Profesor**: Datos personales y laborales de educadores
  - Datos biométricos: color de ojos, color de pelo, estatura, peso, señas particulares
  - Datos personales: CI, nombre, edad, sexo, estado civil
  - Datos de contacto: dirección, teléfonos, email
  - Datos laborales: cargo, especialidad, categoría docente
  - Datos académicos: nivel de inglés, centro de graduación, nota promedio
- **Pasaporte**: Documentos de viaje asociados a profesores
- **Visa**: Permisos de entrada vinculados a pasaportes
- **Contrato**: Misiones internacionales de cooperación
- **Prorroga**: Extensiones de contratos

### Nomencladores

- **Provincia/Municipio**: División político-administrativa (16 provincias, 168 municipios)
- **Pais**: Países destino de cooperación (50+ países)
- **Cargo**: Cargos docentes
- **Especialidad**: Especialidades de enseñanza
- **CategoriaDocente**: Categorías docentes

## 📄 Documentos PDF Generables

El sistema puede generar los siguientes documentos oficiales:

1. **Solicitud de Pasaporte** - Para trámites de pasaporte
2. **Acta de Extranjería** - Para trámites migratorios
3. **Ficha del Profesor** - Información completa del profesor
4. **Cierre de Contrato** - Documento de cierre de misión
5. **Suplemento de Prórroga** - Extensión de contrato

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) con:

- **Access Token**: Válido por 15 minutos
- **Refresh Token**: Válido por 7 días, almacenado en cookie HTTP-only

## 🛠️ Comandos Útiles

```bash
# Instalar dependencias en todo el monorepo
pnpm install

# Desarrollo (ambos servicios)
pnpm dev

# Construir para producción
pnpm build

# Migraciones de base de datos
pnpm db:migrate

# Generar cliente Prisma
pnpm db:generate

# Cargar datos iniciales
pnpm db:seed

# Studio de Prisma (interfaz visual)
pnpm db:studio
```

## 📦 Funcionalidades

### Módulo Potencial

- ✅ CRUD de profesores con datos biométricos
- ✅ Importación desde Excel
- ✅ Exportación a Excel
- ✅ Filtros y paginación
- ✅ Validaciones de datos
- ✅ Generación de ficha en PDF

### Módulo Trámites

- ✅ CRUD de pasaportes
- ✅ CRUD de visas
- ✅ Alertas de vencimiento
- ✅ Generación de PDF de solicitud de pasaporte

### Módulo Contratos

- ✅ CRUD de contratos
- ✅ Validación de no solapamiento
- ✅ Prórrogas múltiples
- ✅ Cierre de contratos
- ✅ Exportación a Excel
- ✅ Generación de acta de extranjería
- ✅ Generación de cierre de contrato
- ✅ Generación de suplemento de prórroga

### Autenticación

- ✅ Login con JWT
- ✅ Refresh tokens
- ✅ Control por roles
- ✅ Protección de rutas

## 🐳 Docker

### Construir imágenes

```bash
# Construir todas las imágenes
docker-compose build

# Reconstruir un servicio específico
docker-compose build api
docker-compose build web
```

### Logs

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres
```

### Detener servicios

```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ Pierde datos)
docker-compose down -v
```

## 📝 Variables de Entorno

### Backend (apps/api/.env)

```env
# Database
DATABASE_URL="postgresql://ice_user:ice_password@localhost:5432/ice_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# API
PORT=3001
```

### Frontend (apps/web/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧪 Testing

```bash
# Backend tests
cd apps/api
pnpm test

# e2e tests
pnpm run test:e2e
```

## 📚 Documentación API

La documentación Swagger está disponible en:

```
http://localhost:3001/api/docs
```

## 🚀 Producción

El sistema está **listo para producción** con las siguientes características:

### Seguridad Hardened

- ✅ Rate limiting (10 req/min por IP)
- ✅ Security headers (Helmet)
- ✅ Non-root Docker containers
- ✅ Request logging
- ✅ Input validation estricto
- ✅ Health checks

### Deployment

```bash
# 1. Configurar variables de entorno
cp .env.example .env
nano .env  # Configurar DB_PASSWORD, JWT_SECRET

# 2. Deploy con Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 3. Verificar salud
curl http://localhost:3001/health
```

### Documentación de Producción

- 📖 [Deployment Guide](DEPLOYMENT.md) - Guía completa de deployment
- 📖 [Production Status](PRODUCTION_STATUS.md) - Estado de producción
- 📖 [Demo Guide](README_DEMO.md) - Guía para demo
- 🔧 [.env.example](.env.example) - Variables de entorno

### Backup Automatizado

```bash
# Backup manual
./scripts/backup-db.sh

# Agregar a crontab (automático diario)
0 2 * * * /path/to/ice-system/scripts/backup-db.sh
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Refresh tokens rotativos
- Protección CSRF en cookies
- Headers de seguridad con Helmet
- Rate limiting global
- Request logging completo
- Non-root containers

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto es propiedad del Ministerio de Educación.

## 📞 Soporte

Para soporte técnico contactar: soporte@ice.cu
