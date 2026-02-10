# Multi-stage build for NestJS API - Optimizado
FROM node:20-alpine AS base

# Etapa 1: Dependencias de producción
FROM base AS deps-prod
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm@9.0.0

# Copiar archivos del workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/

# Instalar SOLO dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Etapa 2: Build (necesita todas las dependencias)
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm@9.0.0

# Copiar todo el código
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY apps/api ./apps/api

# Instalar TODAS las dependencias (para compilar)
RUN pnpm install --frozen-lockfile

# Generar Prisma Client
RUN cd apps/api && npx prisma generate

# Build de la aplicación
RUN cd apps/api && pnpm build

# Copiar templates al dist (necesario para PDF generation)
RUN mkdir -p /app/apps/api/dist/templates && \
    cp /app/apps/api/src/templates/* /app/apps/api/dist/templates/ 2>/dev/null || \
    echo "No templates to copy"

# Etapa 3: Imagen de producción (solo runtime)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Instalar dependencias del sistema necesarias
RUN apk update && apk upgrade && apk add --no-cache dumb-init openssl

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copiar solo archivos necesarios
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=deps-prod /app/apps/api/node_modules ./node_modules

# Crear directorio uploads
RUN mkdir -p uploads

# Permisos
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["dumb-init", "node", "dist/main"]
