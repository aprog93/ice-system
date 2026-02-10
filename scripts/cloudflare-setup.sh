#!/bin/bash

# Cloudflare Tunnel Setup Script for ICE System
# This script helps you set up a secure tunnel to expose ICE System to the internet

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Cloudflare Tunnel Setup for ICE      ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Function to create tunnel
create_tunnel() {
    echo -e "${YELLOW}Creating Cloudflare Tunnel...${NC}"
    echo ""
    
    # Check if cloudflared is installed
    if ! command -v cloudflared &> /dev/null; then
        echo -e "${YELLOW}Installing cloudflared...${NC}"
        
        # Detect OS and install
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
            sudo dpkg -i cloudflared.deb
            rm cloudflared.deb
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install cloudflared
        else
            echo -e "${RED}Please install cloudflared manually from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation${NC}"
            exit 1
        fi
    fi
    
    # Authenticate
    echo -e "${YELLOW}Step 1: Authenticating with Cloudflare...${NC}"
    echo "This will open a browser window to login to Cloudflare."
    read -p "Press Enter to continue..."
    
    cloudflared tunnel login
    
    # Create tunnel
    echo ""
    echo -e "${YELLOW}Step 2: Creating tunnel...${NC}"
    read -p "Enter a name for your tunnel (e.g., ice-system): " TUNNEL_NAME
    
    TUNNEL_OUTPUT=$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1)
    TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP 'Created tunnel \K[^ ]+' | head -1)
    
    if [ -z "$TUNNEL_ID" ]; then
        echo -e "${RED}Failed to create tunnel. Error:${NC}"
        echo "$TUNNEL_OUTPUT"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Tunnel created: $TUNNEL_ID${NC}"
    
    # Get credentials file path
    CREDENTIALS_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
    
    # Configure tunnel
    echo ""
    echo -e "${YELLOW}Step 3: Configuring tunnel routes...${NC}"
    
    # Ask for domain
    read -p "Enter your domain (e.g., tunombre.com): " DOMAIN
    read -p "Enter subdomain for ICE (e.g., ice): " SUBDOMAIN
    
    FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
    
    # Create config file
    CONFIG_FILE="$HOME/.cloudflared/config.yml"
    
    cat > "$CONFIG_FILE" << EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CREDENTIALS_FILE}

ingress:
  - hostname: ${FULL_DOMAIN}
    service: http://localhost:3000
  - hostname: api.${FULL_DOMAIN}
    service: http://localhost:3001
  - service: http_status:404
EOF
    
    echo -e "${GREEN}✓ Configuration saved to: $CONFIG_FILE${NC}"
    
    # Create DNS records
    echo ""
    echo -e "${YELLOW}Step 4: Creating DNS records...${NC}"
    
    cloudflared tunnel route dns "$TUNNEL_NAME" "$FULL_DOMAIN"
    cloudflared tunnel route dns "$TUNNEL_NAME" "api.$FULL_DOMAIN"
    
    echo -e "${GREEN}✓ DNS records created:${NC}"
    echo "  - https://$FULL_DOMAIN"
    echo "  - https://api.$FULL_DOMAIN"
    
    # Get tunnel token for Docker
    echo ""
    echo -e "${YELLOW}Step 5: Getting tunnel token for Docker...${NC}"
    
    TUNNEL_TOKEN=$(cloudflared tunnel token "$TUNNEL_NAME")
    
    # Save to .env file
    if [ -f .env ]; then
        # Remove existing CLOUDFLARE_TUNNEL_TOKEN
        grep -v "CLOUDFLARE_TUNNEL_TOKEN" .env > .env.tmp || true
        mv .env.tmp .env
    fi
    
    echo "CLOUDFLARE_TUNNEL_TOKEN=$TUNNEL_TOKEN" >> .env
    
    echo -e "${GREEN}✓ Token saved to .env file${NC}"
    
    # Instructions
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Setup Complete! 🎉                  ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Your ICE System will be available at:"
    echo -e "  ${BLUE}https://$FULL_DOMAIN${NC}"
    echo -e "  ${BLUE}https://api.$FULL_DOMAIN${NC}"
    echo ""
    echo "To start with Cloudflare Tunnel:"
    echo -e "  ${YELLOW}./docker-start.sh cloudflare${NC}"
    echo ""
    echo "Or run tunnel locally:"
    echo -e "  ${YELLOW}cloudflared tunnel run $TUNNEL_NAME${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}Cloudflare Tunnel Status:${NC}"
    
    if docker ps | grep -q "ice-cloudflared"; then
        echo -e "${GREEN}✓ Tunnel container is running${NC}"
        docker logs --tail 20 ice-cloudflared
    else
        echo -e "${YELLOW}⚠ Tunnel container is not running${NC}"
    fi
}

# Function to show help
show_help() {
    echo "Cloudflare Tunnel Management for ICE System"
    echo ""
    echo "Usage: ./cloudflare-setup.sh [command]"
    echo ""
    echo "Commands:"
    echo "  create    Create a new Cloudflare Tunnel"
    echo "  status    Show tunnel status"
    echo "  help      Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  - A Cloudflare account (free)"
    echo "  - A domain managed by Cloudflare"
    echo "  - Docker and Docker Compose installed"
}

# Main
case "${1:-help}" in
    create)
        create_tunnel
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
