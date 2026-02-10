# Multi-stage build for NestJS API
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Copy templates to dist (for PDF generation)
RUN mkdir -p apps/api/dist/templates && cp apps/api/src/templates/* apps/api/dist/templates/ 2>/dev/null || true

# Build the application
RUN cd apps/api && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install security updates and required packages
RUN apk update && apk upgrade && apk add --no-cache dumb-init openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Install Prisma CLI for migrations
RUN npm install -g prisma

# Copy necessary files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./node_modules

# Copy templates (both from src and dist)
COPY --from=builder /app/apps/api/src/templates ./templates
COPY --from=builder /app/apps/api/dist/templates ./dist/templates 2>/dev/null || true

# Create uploads directory
RUN mkdir -p uploads

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/main"]
