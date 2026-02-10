# Multi-stage build for Next.js - Optimizado
FROM node:20-alpine AS base

# Etapa 1: Dependencias de producción
FROM base AS deps-prod
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g pnpm@9.0.0

# Copiar archivos del workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/

# Instalar SOLO dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Etapa 2: Build (necesita todas las dependencias)
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g pnpm@9.0.0

# Argumento para build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001}

# Copiar todo el código
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY apps/web ./apps/web

# Instalar TODAS las dependencias (para compilar)
RUN pnpm install --frozen-lockfile

# Build de la aplicación
RUN cd apps/web && pnpm build

# Etapa 3: Imagen de producción (solo runtime)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copiar solo el build standalone y dependencias de prod
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=deps-prod /app/apps/web/node_modules ./node_modules

# Permisos
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
