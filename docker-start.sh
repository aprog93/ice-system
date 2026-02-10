#!/bin/bash

# ICE System Docker Management Script
# Usage: ./docker-start.sh [dev|prod|traefik|cloudflare|build|stop|logs|clean]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_DEV="docker-compose.dev.yml"
COMPOSE_PROD="docker-compose.yml"
COMPOSE_TRAEFIK="docker-compose.traefik.yml"
COMPOSE_CLOUDFLARE="docker-compose.cloudflare.yml"

# Docker Compose command (use plugin if available, fallback to legacy)
if docker compose version &>/dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_help() {
    echo -e "${BLUE}ICE System Docker Management${NC}"
    echo ""
    echo "Usage: ./docker-start.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev         Start development environment with hot reload"
    echo "  prod        Start production environment"
    echo "  traefik     Start with Traefik reverse proxy (requires DOMAIN env)"
    echo "  cloudflare  Start with Cloudflare Tunnel (requires CF_TUNNEL_TOKEN)"
    echo "  build       Build all Docker images"
    echo "  stop        Stop all containers"
    echo "  logs        Show logs from all containers"
    echo "  clean       Remove all containers, volumes, and images"
    echo "  migrate     Run database migrations"
    echo "  seed        Seed the database with initial data"
    echo "  shell-api   Open a shell in the API container"
    echo "  shell-web   Open a shell in the Web container"
    echo "  ps          Show running containers"
    echo ""
    echo "Examples:"
    echo "  ./docker-start.sh dev                    # Start development"
    echo "  ./docker-start.sh prod                   # Start production"
    echo "  DOMAIN=ice.local ./docker-start.sh traefik  # Start with Traefik"
    echo "  CF_TUNNEL_TOKEN=xxx ./docker-start.sh cloudflare  # Start with Cloudflare"
    echo "  ./docker-start.sh logs                   # View logs"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi

    if ! docker compose version &> /dev/null && ! command -v $DOCKER_COMPOSE &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}Error: Docker daemon is not running${NC}"
        exit 1
    fi
}

start_dev() {
    echo -e "${GREEN}Starting ICE System in DEVELOPMENT mode...${NC}"
    check_docker
    
    # Create necessary directories
    mkdir -p backups uploads
    
    # Start services
    $DOCKER_COMPOSE -f $COMPOSE_DEV up -d
    
    echo ""
    echo -e "${GREEN}✓ Development environment started!${NC}"
    echo ""
    echo "Services:"
    echo "  - Web App:     http://localhost:3000"
    echo "  - API:         http://localhost:3001"
    echo "  - API Docs:    http://localhost:3001/api/docs"
    echo "  - Database:    localhost:5432"
    echo ""
    echo "Logs: ./docker-start.sh logs"
    echo "Stop: ./docker-start.sh stop"
}

start_prod() {
    echo -e "${GREEN}Starting ICE System in PRODUCTION mode...${NC}"
    check_docker
    
    # Create necessary directories
    mkdir -p backups uploads nginx/ssl
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Warning: .env file not found. Using default values.${NC}"
        echo "Please create a .env file with your production settings."
        echo ""
    fi
    
    # Build and start services
    $DOCKER_COMPOSE -f $COMPOSE_PROD up -d --build
    
    echo ""
    echo -e "${GREEN}✓ Production environment started!${NC}"
    echo ""
    echo "Services:"
    echo "  - Web App:     http://localhost:3000"
    echo "  - API:         http://localhost:3001"
    echo "  - API Docs:    http://localhost:3001/api/docs"
    echo ""
    echo "To enable Nginx reverse proxy, run:"
    echo "  $DOCKER_COMPOSE -f $COMPOSE_PROD --profile with-nginx up -d"
}

start_traefik() {
    echo -e "${GREEN}Starting ICE System with Traefik reverse proxy...${NC}"
    check_docker
    
    # Check if DOMAIN is set
    if [ -z "$DOMAIN" ]; then
        echo -e "${YELLOW}Warning: DOMAIN environment variable not set.${NC}"
        echo "Using 'localhost' as default. Set DOMAIN for production use."
        echo ""
        echo "Example: DOMAIN=ice.yourdomain.com ./docker-start.sh traefik"
        DOMAIN="localhost"
    fi
    
    # Create necessary directories
    mkdir -p backups uploads letsencrypt
    
    # Create network if it doesn't exist
    docker network create ice-network 2>/dev/null || true
    
    # Start services with Traefik
    DOMAIN=$DOMAIN $DOCKER_COMPOSE -f $COMPOSE_TRAEFIK up -d
    
    echo ""
    echo -e "${GREEN}✓ Traefik environment started!${NC}"
    echo ""
    echo "Services:"
    echo "  - Web App:     http://${DOMAIN}"
    echo "  - API:         http://${DOMAIN}/api"
    echo "  - Traefik Dashboard: http://traefik.${DOMAIN}:8080"
    echo ""
    echo "To enable HTTPS, configure ACME_EMAIL in .env and uncomment TLS lines in docker-compose.traefik.yml"
}

start_cloudflare() {
    echo -e "${GREEN}Starting ICE System with Cloudflare Tunnel...${NC}"
    check_docker
    
    # Check if CF_TUNNEL_TOKEN is set
    if [ -z "$CF_TUNNEL_TOKEN" ]; then
        echo -e "${RED}Error: CF_TUNNEL_TOKEN environment variable is required${NC}"
        echo ""
        echo "To set up a Cloudflare Tunnel:"
        echo "  1. Run: ./scripts/cloudflare-setup.sh create"
        echo "  2. Copy the token from the output"
        echo "  3. Run: CF_TUNNEL_TOKEN=xxx ./docker-start.sh cloudflare"
        echo ""
        exit 1
    fi
    
    # Create necessary directories
    mkdir -p backups uploads
    
    # Start services with Cloudflare Tunnel
    CF_TUNNEL_TOKEN=$CF_TUNNEL_TOKEN $DOCKER_COMPOSE -f $COMPOSE_CLOUDFLARE up -d
    
    echo ""
    echo -e "${GREEN}✓ Cloudflare Tunnel started!${NC}"
    echo ""
    echo "Your application is now accessible through Cloudflare Tunnel!"
    echo "Check the Cloudflare dashboard for your public URL."
}

build_images() {
    echo -e "${GREEN}Building Docker images...${NC}"
    check_docker
    
    $DOCKER_COMPOSE -f $COMPOSE_PROD build --no-cache
    
    echo ""
    echo -e "${GREEN}✓ Images built successfully!${NC}"
}

stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    
    $DOCKER_COMPOSE -f $COMPOSE_DEV down 2>/dev/null || true
    $DOCKER_COMPOSE -f $COMPOSE_PROD down 2>/dev/null || true
    $DOCKER_COMPOSE -f $COMPOSE_TRAEFIK down 2>/dev/null || true
    $DOCKER_COMPOSE -f $COMPOSE_CLOUDFLARE down 2>/dev/null || true
    
    echo -e "${GREEN}✓ All services stopped${NC}"
}

show_logs() {
    echo -e "${BLUE}Showing logs (Press Ctrl+C to exit)...${NC}"
    
    # Try dev first, then prod
    if $DOCKER_COMPOSE -f $COMPOSE_DEV ps | grep -q "Up"; then
        $DOCKER_COMPOSE -f $COMPOSE_DEV logs -f
    elif $DOCKER_COMPOSE -f $COMPOSE_PROD ps | grep -q "Up"; then
        $DOCKER_COMPOSE -f $COMPOSE_PROD logs -f
    else
        echo -e "${YELLOW}No running containers found${NC}"
    fi
}

clean_all() {
    echo -e "${RED}Warning: This will remove all containers, volumes, and images!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleaning up...${NC}"
        
        $DOCKER_COMPOSE -f $COMPOSE_DEV down -v --rmi all 2>/dev/null || true
        $DOCKER_COMPOSE -f $COMPOSE_PROD down -v --rmi all 2>/dev/null || true
        $DOCKER_COMPOSE -f $COMPOSE_TRAEFIK down -v --rmi all 2>/dev/null || true
        $DOCKER_COMPOSE -f $COMPOSE_CLOUDFLARE down -v --rmi all 2>/dev/null || true
        
        # Remove volumes
        docker volume rm ice-system_postgres_data 2>/dev/null || true
        docker volume rm ice-system_api_uploads 2>/dev/null || true
        docker volume rm ice-system_letsencrypt 2>/dev/null || true
        docker network rm ice-network 2>/dev/null || true
        
        echo -e "${GREEN}✓ Cleanup complete${NC}"
    else
        echo "Cancelled"
    fi
}

run_migrate() {
    echo -e "${GREEN}Running database migrations...${NC}"
    
    if $DOCKER_COMPOSE -f $COMPOSE_DEV ps | grep -q "ice-api-dev"; then
        $DOCKER_COMPOSE -f $COMPOSE_DEV exec api npx prisma migrate dev
    elif $DOCKER_COMPOSE -f $COMPOSE_PROD ps | grep -q "ice-api"; then
        $DOCKER_COMPOSE -f $COMPOSE_PROD exec api npx prisma migrate deploy
    else
        echo -e "${RED}API container is not running${NC}"
        exit 1
    fi
}

run_seed() {
    echo -e "${GREEN}Seeding database...${NC}"
    
    if $DOCKER_COMPOSE -f $COMPOSE_DEV ps | grep -q "ice-api-dev"; then
        $DOCKER_COMPOSE -f $COMPOSE_DEV exec api npx prisma db seed
    elif $DOCKER_COMPOSE -f $COMPOSE_PROD ps | grep -q "ice-api"; then
        $DOCKER_COMPOSE -f $COMPOSE_PROD exec api npx prisma db seed
    else
        echo -e "${RED}API container is not running${NC}"
        exit 1
    fi
}

open_shell_api() {
    if $DOCKER_COMPOSE -f $COMPOSE_DEV ps | grep -q "ice-api-dev"; then
        $DOCKER_COMPOSE -f $COMPOSE_DEV exec api sh
    elif $DOCKER_COMPOSE -f $COMPOSE_PROD ps | grep -q "ice-api"; then
        $DOCKER_COMPOSE -f $COMPOSE_PROD exec api sh
    else
        echo -e "${RED}API container is not running${NC}"
        exit 1
    fi
}

open_shell_web() {
    if $DOCKER_COMPOSE -f $COMPOSE_DEV ps | grep -q "ice-web-dev"; then
        $DOCKER_COMPOSE -f $COMPOSE_DEV exec web sh
    elif $DOCKER_COMPOSE -f $COMPOSE_PROD ps | grep -q "ice-web"; then
        $DOCKER_COMPOSE -f $COMPOSE_PROD exec web sh
    else
        echo -e "${RED}Web container is not running${NC}"
        exit 1
    fi
}

show_ps() {
    echo -e "${BLUE}Development containers:${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_DEV ps 2>/dev/null || echo "Not running"
    
    echo ""
    echo -e "${BLUE}Production containers:${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_PROD ps 2>/dev/null || echo "Not running"
    
    echo ""
    echo -e "${BLUE}Traefik containers:${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_TRAEFIK ps 2>/dev/null || echo "Not running"
    
    echo ""
    echo -e "${BLUE}Cloudflare containers:${NC}"
    $DOCKER_COMPOSE -f $COMPOSE_CLOUDFLARE ps 2>/dev/null || echo "Not running"
}

# Main script logic
case "${1:-help}" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    traefik)
        start_traefik
        ;;
    cloudflare)
        start_cloudflare
        ;;
    build)
        build_images
        ;;
    stop)
        stop_services
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_all
        ;;
    migrate)
        run_migrate
        ;;
    seed)
        run_seed
        ;;
    shell-api)
        open_shell_api
        ;;
    shell-web)
        open_shell_web
        ;;
    ps)
        show_ps
        ;;
    help|--help|-h)
        print_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        print_help
        exit 1
        ;;
esac
