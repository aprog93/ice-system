# 🐳 Docker Configuration for ICE System

Complete Docker setup for the ICE System monorepo with support for development and production environments.

## 📁 Structure

```
.
├── docker-compose.yml           # Production configuration
├── docker-compose.dev.yml       # Development configuration (hot reload)
├── docker-start.sh             # Management script
├── .env.example                # Environment variables template
├── .dockerignore               # Docker ignore rules
├── apps/
│   ├── api/
│   │   ├── Dockerfile          # Production Dockerfile
│   │   └── Dockerfile.dev      # Development Dockerfile
│   └── web/
│       ├── Dockerfile          # Production Dockerfile
│       └── Dockerfile.dev      # Development Dockerfile
└── nginx/
    └── nginx.conf              # Nginx reverse proxy config
```

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- pnpm 9.0+ (for local development)

### Development Mode (with hot reload)

```bash
# Start development environment
./docker-start.sh dev

# Access the services:
# - Web App:  http://localhost:3000
# - API:      http://localhost:3001
# - API Docs: http://localhost:3001/api/docs
# - Database: localhost:5432
```

### Production Mode

```bash
# Create environment file
cp .env.example .env
# Edit .env with your production values

# Start production environment
./docker-start.sh prod
```

## 📜 Available Commands

Use the `./docker-start.sh` script for easy management:

```bash
./docker-start.sh dev          # Start development environment
./docker-start.sh prod         # Start production environment
./docker-start.sh build        # Build all Docker images
./docker-start.sh stop         # Stop all containers
./docker-start.sh logs         # Show logs from all containers
./docker-start.sh migrate      # Run database migrations
./docker-start.sh seed         # Seed the database
./docker-start.sh shell-api    # Open shell in API container
./docker-start.sh shell-web    # Open shell in Web container
./docker-start.sh clean        # Remove all containers and volumes
./docker-start.sh ps           # Show running containers
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable              | Description              | Default               |
| --------------------- | ------------------------ | --------------------- |
| `DB_USER`             | Database username        | ice_user              |
| `DB_PASSWORD`         | Database password        | ice_password          |
| `DB_NAME`             | Database name            | ice_db                |
| `JWT_SECRET`          | JWT signing secret       | -                     |
| `JWT_REFRESH_SECRET`  | JWT refresh token secret | -                     |
| `NEXT_PUBLIC_API_URL` | API URL for frontend     | http://localhost:3001 |

## 🏗️ Architecture

### Services

1. **PostgreSQL** (Database)
   - Image: `postgres:16-alpine`
   - Port: `5432`
   - Persistent volume for data

2. **API** (NestJS)
   - Port: `3001`
   - Auto-migrations on startup
   - Health check endpoint: `/health/live`

3. **Web** (Next.js)
   - Port: `3000`
   - Standalone output for optimized Docker image

4. **Nginx** (Optional)
   - Port: `80/443`
   - Reverse proxy for web and API
   - Enable with: `--profile with-nginx`

### Networks

All services communicate through the `ice-network` bridge network.

### Volumes

- `postgres_data`: Persistent database storage
- `api_uploads`: File uploads directory

## 🔄 Development Workflow

### Hot Reload

In development mode, changes to source code are automatically reflected:

- **API**: Changes trigger NestJS restart
- **Web**: Changes trigger Next.js Fast Refresh

### Database Migrations

```bash
# Run migrations
./docker-start.sh migrate

# Seed database
./docker-start.sh seed

# Access Prisma Studio
# (Run locally, not in Docker)
cd apps/api && npx prisma studio
```

## 🚀 Production Deployment

### Using Docker Compose

```bash
# 1. Set environment variables
cp .env.example .env
nano .env  # Edit with production values

# 2. Build and start
./docker-start.sh prod

# 3. Run migrations
./docker-start.sh migrate
```

### Using Nginx Reverse Proxy

```bash
# Start with Nginx
docker-compose --profile with-nginx up -d
```

### SSL/HTTPS

Place your SSL certificates in `nginx/ssl/`:

```
nginx/ssl/
├── cert.pem
└── key.pem
```

## 🧹 Maintenance

### Cleanup

```bash
# Remove all containers, volumes, and images
./docker-start.sh clean
```

### Backup Database

```bash
# Create backup
docker exec ice-postgres pg_dump -U ice_user ice_db > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i ice-postgres psql -U ice_user ice_db < backup_20240101.sql
```

## 🔍 Troubleshooting

### Container won't start

```bash
# Check logs
./docker-start.sh logs

# Check container status
./docker-start.sh ps
```

### Database connection issues

```bash
# Check if database is healthy
docker-compose exec postgres pg_isready -U ice_user

# Reset database (WARNING: deletes all data)
docker-compose down -v
```

### Rebuild images

```bash
./docker-start.sh build
```

## 📦 Image Sizes

- **API**: ~200MB (Alpine Linux + Node.js + app)
- **Web**: ~150MB (Alpine Linux + Node.js + Next.js standalone)
- **PostgreSQL**: ~90MB (Alpine Linux)

## 🔒 Security

- Services run as non-root users
- Secrets passed via environment variables
- Database isolated in private network
- Health checks for all services

## 📝 Notes

- The API Dockerfile copies templates for PDF generation
- Puppeteer is included in the API image for PDF generation
- Next.js uses standalone output for minimal image size
