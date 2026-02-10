# ICE System - Docker & Internet Exposure Guide

## 🚀 Quick Start

### Local Development

```bash
./docker-start.sh dev
```

Access at: http://localhost:3000 (Web), http://localhost:3001 (API)

### Production

```bash
./docker-start.sh prod
```

---

## 🌐 Internet Exposure Options

### Option 1: Traefik (Recommended for Local Network/Server)

**Best for:** You have a server with public IP or local network with DNS

```bash
# Start with Traefik
DOMAIN=ice.yourdomain.com ./docker-start.sh traefik

# Or for local testing
DOMAIN=ice.local ./docker-start.sh traefik
```

**Features:**

- Automatic HTTP routing
- Built-in dashboard at http://traefik.yourdomain.com:8080
- Let's Encrypt HTTPS support (configure ACME_EMAIL in .env)
- Clean URLs (no ports needed)

**Requirements:**

- Domain pointing to server (or /etc/hosts entry for local)
- Ports 80 and 443 open (or just 80 for HTTP)

---

### Option 2: Cloudflare Tunnel (Recommended for Internet)

**Best for:** No public IP, behind NAT/firewall, easiest HTTPS

```bash
# Step 1: Create Cloudflare Tunnel
./scripts/cloudflare-setup.sh create

# Step 2: Follow the instructions to get your token
# Then:
CF_TUNNEL_TOKEN=eyJ... ./docker-start.sh cloudflare
```

**Features:**

- No public IP required
- No port opening needed
- Free automatic HTTPS
- DDoS protection
- Secure tunnel to Cloudflare edge

**Requirements:**

- Cloudflare account (free)
- Domain managed by Cloudflare

---

## 📋 Docker Commands Reference

```bash
# Start development
./docker-start.sh dev

# Start production
./docker-start.sh prod

# Start with Traefik
DOMAIN=ice.example.com ./docker-start.sh traefik

# Start with Cloudflare Tunnel
CF_TUNNEL_TOKEN=xxx ./docker-start.sh cloudflare

# View logs
./docker-start.sh logs

# Run database migrations
./docker-start.sh migrate

# Seed database
./docker-start.sh seed

# Open shell in containers
./docker-start.sh shell-api
./docker-start.sh shell-web

# Stop all services
./docker-start.sh stop

# Clean everything (removes containers, volumes, images)
./docker-start.sh clean

# Check running containers
./docker-start.sh ps
```

---

## 🔧 Environment Variables

Create a `.env` file:

```env
# Database
DB_USER=ice_user
DB_PASSWORD=secure_password
DB_NAME=ice_db
DATABASE_URL=postgresql://ice_user:secure_password@postgres:5432/ice_db?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# API
API_PORT=3001
API_URL=http://localhost:3001

# Web
NEXT_PUBLIC_API_URL=http://localhost:3001
WEB_PORT=3000

# CORS
CORS_ORIGIN=http://localhost:3000

# Environment
NODE_ENV=production

# Traefik (optional)
ACME_EMAIL=admin@yourdomain.com

# Cloudflare Tunnel (optional)
CF_TUNNEL_TOKEN=your-tunnel-token
```

---

## 🔒 Security Checklist

Before exposing to the Internet:

- [ ] Change default database password
- [ ] Generate strong JWT secrets
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN to your domain
- [ ] Enable HTTPS (Traefik with Let's Encrypt or Cloudflare)
- [ ] Remove any test data from database
- [ ] Enable rate limiting (already configured in API)

---

## 🐛 Troubleshooting

### Permission Denied

```bash
sudo usermod -aG docker $USER
# Logout and login again
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Or use different ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Reset database
./docker-start.sh clean
./docker-start.sh dev
./docker-start.sh migrate
./docker-start.sh seed
```

### Cloudflare Tunnel Not Connecting

```bash
# Check logs
CF_TUNNEL_TOKEN=xxx ./docker-start.sh cloudflare
docker logs ice-cloudflared
```

---

## 📁 File Structure

```
ice-system/
├── docker-start.sh                 # Management script
├── docker-compose.yml              # Production compose
├── docker-compose.dev.yml          # Development compose
├── docker-compose.traefik.yml      # Traefik reverse proxy
├── docker-compose.cloudflare.yml   # Cloudflare Tunnel
├── apps/
│   ├── api/Dockerfile              # API production image
│   ├── api/Dockerfile.dev          # API development image
│   ├── web/Dockerfile              # Web production image
│   └── web/Dockerfile.dev          # Web development image
├── scripts/
│   └── cloudflare-setup.sh         # Cloudflare Tunnel setup
└── .env                            # Environment variables
```

---

## 🆘 Support

For issues:

1. Check logs: `./docker-start.sh logs`
2. Verify Docker: `docker version`
3. Check containers: `./docker-start.sh ps`
4. Review this guide

---

## ✅ Status

- [x] Docker configuration complete
- [x] Traefik reverse proxy configured
- [x] Cloudflare Tunnel configured
- [x] Management script updated
- [x] Documentation complete

**Ready for Internet exposure!** 🚀
