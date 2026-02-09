# 🚀 ICE System - Production Deployment Guide

## 📋 Pre-Deployment Checklist

- [ ] Server with Docker & Docker Compose installed
- [ ] Domain name configured (optional, for SSL)
- [ ] SSL certificates (optional, for HTTPS)
- [ ] Environment variables configured
- [ ] Database backup strategy in place
- [ ] Monitoring setup

---

## 🔧 Step 1: Server Setup

### Requirements

- **OS**: Ubuntu 22.04 LTS (recommended) or any Linux with Docker
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 20GB minimum, 50GB recommended
- **CPU**: 2 cores minimum

### Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📦 Step 2: Project Setup

### Clone Repository

```bash
git clone <repository-url> ice-system
cd ice-system
```

### Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit with your production values
nano .env
```

### Required Environment Variables

```env
# Database
DB_USER=ice_user
DB_PASSWORD=your-strong-password-here
DB_NAME=ice_system

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# CORS (your domain)
CORS_ORIGIN=https://your-domain.com

# API URL (for frontend)
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
```

---

## 🚀 Step 3: Deploy

### Option A: Quick Deploy (without SSL)

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Seed with demo data (optional)
docker-compose -f docker-compose.prod.yml exec api npx prisma db seed
```

### Option B: Production Deploy (with SSL/Nginx)

```bash
# Create nginx configuration
mkdir -p nginx
nano nginx/nginx.conf

# Deploy with nginx
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

### Verify Deployment

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web

# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:3001/health/ready
```

---

## 🔄 Step 4: Database Management

### Create Backup

```bash
# Manual backup
./scripts/backup-db.sh

# List backups
./scripts/backup-db.sh --list

# Automated daily backup (add to crontab)
crontab -e
# Add: 0 2 * * * /path/to/ice-system/scripts/backup-db.sh >> /var/log/ice-backup.log 2>&1
```

### Restore from Backup

```bash
# Stop services
docker-compose -f docker-compose.prod.yml stop api

# Restore database
./scripts/backup-db.sh --restore

# Start services
docker-compose -f docker-compose.prod.yml start api
```

---

## 🔒 Step 5: SSL/TLS (HTTPS)

### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# Restart with nginx
docker-compose -f docker-compose.prod.yml --profile with-nginx restart nginx
```

### Auto-renewal

```bash
# Add to crontab
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Step 6: Monitoring

### Check Service Health

```bash
# API health
curl http://localhost:3001/health

# Database health
curl http://localhost:3001/health/db

# Full system status
curl http://localhost:3001/health/ready
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f db
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

---

## 🔄 Step 7: Updates & Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Database Migrations

```bash
# Create migration (during development)
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate dev --name migration_name

# Deploy migration (in production)
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### Cleanup

```bash
# Remove unused images and volumes
docker system prune -a --volumes
```

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service_name

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api
```

### Database Connection Issues

```bash
# Check if database is healthy
docker-compose -f docker-compose.prod.yml ps

# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Verify environment variables
docker-compose -f docker-compose.prod.yml exec api env | grep DB_
```

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process or change port in docker-compose.prod.yml
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Clean old backups
find ./backups -name "*.sql.gz" -mtime +30 -delete
```

---

## 🔐 Security Checklist

- [ ] Changed default passwords
- [ ] JWT secrets are strong (32+ chars, random)
- [ ] Database password is strong
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSL/TLS enabled
- [ ] Rate limiting enabled
- [ ] Regular backups configured
- [ ] Container running as non-root user
- [ ] Health checks enabled
- [ ] Logs being monitored

---

## 📈 Performance Tuning

### Database Optimization

```bash
# Analyze tables for query optimization
docker-compose -f docker-compose.prod.yml exec db psql -U ice_user -d ice_system -c "ANALYZE;"

# Check slow queries
docker-compose -f docker-compose.prod.yml exec db psql -U ice_user -d ice_system -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Docker Resource Limits

Edit `docker-compose.prod.yml` to add resource limits:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify health: `curl http://localhost:3001/health`
3. Check environment: `docker-compose -f docker-compose.prod.yml config`
4. Review documentation: `README.md`, `README_DEMO.md`

---

## ✅ Post-Deployment Verification

Run these checks to ensure everything works:

```bash
# 1. All services running
docker-compose -f docker-compose.prod.yml ps

# 2. API responding
curl http://localhost:3001/health

# 3. Can login via API
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'

# 4. Database accessible
docker-compose -f docker-compose.prod.yml exec db pg_isready

# 5. Frontend loading
curl -I http://localhost:3000

# 6. Backup working
./scripts/backup-db.sh --list
```

---

## 🎉 Success!

Your ICE System is now deployed in production!

**Access your application:**

- Frontend: http://your-domain.com (or http://your-server-ip:3000)
- API: http://your-domain.com/api/v1
- API Docs: http://your-domain.com/api/docs
- Health Check: http://your-domain.com/health

**Default Login:**

- Username: `demo`
- Password: `demo123`

---

**Next Steps:**

- Set up monitoring (Prometheus/Grafana)
- Configure alerting
- Set up CI/CD pipeline
- Review security periodically
