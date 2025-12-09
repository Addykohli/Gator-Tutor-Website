#!/bin/bash
# Deployment script: Builds, packages, and deploys to server

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build"

# Configuration (adjust as needed)
SERVER_USER="ubuntu"
SERVER_HOST="3.101.155.82"
SERVER_HOME="/home/atharva"
APP_DIR="/home/atharva/csc648-fa25-145-team08/application"
SSH_KEY="${PROJECT_ROOT}/../../credentials/access_keys/csc648-team-08-key.pem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Deployment Script ==="
echo ""

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}Build directory not found. Running build script...${NC}"
    "$SCRIPT_DIR/build.sh"
fi

# Check if build was successful
if [ ! -d "$BUILD_DIR/frontend" ] || [ ! -f "$BUILD_DIR/nginx.conf" ]; then
    echo -e "${RED}✗ Error: Build incomplete. Please run build.sh first.${NC}"
    exit 1
fi

# Create tar.gz package
echo "1. Creating deployment package..."
PACKAGE_NAME="deployment-$(date +%Y%m%d-%H%M%S).tar.gz"
PACKAGE_PATH="$PROJECT_ROOT/$PACKAGE_NAME"

cd "$PROJECT_ROOT"
tar -czf "$PACKAGE_PATH" -C "$BUILD_DIR" .
echo -e "${GREEN}   ✓ Package created: $PACKAGE_NAME${NC}"
echo ""

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${YELLOW}Warning: SSH key not found at $SSH_KEY${NC}"
    echo "Please provide SSH key path or ensure key is in SSH agent"
    read -p "Continue with default SSH? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    SSH_OPTIONS=""
else
    SSH_OPTIONS="-i $SSH_KEY"
    chmod 600 "$SSH_KEY" 2>/dev/null || true
fi

# Upload to server
echo "2. Uploading to server..."
scp $SSH_OPTIONS "$PACKAGE_PATH" "${SERVER_USER}@${SERVER_HOST}:${SERVER_HOME}/"
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Error: Failed to upload package${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Package uploaded${NC}"
echo ""

# Deploy on server
echo "3. Deploying on server..."
echo "   (You may be prompted for sudo password)"

ssh $SSH_OPTIONS "${SERVER_USER}@${SERVER_HOST}" << EOF
set -e

PACKAGE_NAME="$PACKAGE_NAME"
SERVER_HOME="$SERVER_HOME"
EXTRACT_DIR="\${SERVER_HOME}/deployment-extract-\$(date +%s)"

echo "Extracting package..."
mkdir -p "\$EXTRACT_DIR"
tar -xzf "\${SERVER_HOME}/\${PACKAGE_NAME}" -C "\$EXTRACT_DIR"

echo "Deploying frontend..."
# Backup existing build if it exists
if [ -d "\${SERVER_HOME}/build" ]; then
    mv "\${SERVER_HOME}/build" "\${SERVER_HOME}/build.backup.\$(date +%s)"
fi
# Copy new build
cp -r "\$EXTRACT_DIR/frontend" "\${SERVER_HOME}/build"

echo "Deploying backend..."
# Backup existing backend if it exists
if [ -d "\${SERVER_HOME}/backend" ]; then
    mv "\${SERVER_HOME}/backend" "\${SERVER_HOME}/backend.backup.\$(date +%s)"
fi
# Copy new backend
cp -r "\$EXTRACT_DIR/backend" "\${SERVER_HOME}/backend"

echo "Updating nginx configuration..."
# Test nginx config first
if sudo nginx -t 2>/dev/null; then
    # Backup current nginx config
    if [ -f /etc/nginx/sites-available/default ]; then
        sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.\$(date +%s)
    fi
    # Copy new config (you may need to adjust the destination)
    sudo cp "\$EXTRACT_DIR/nginx.conf" /etc/nginx/sites-available/default
    # Test again
    if sudo nginx -t; then
        echo "Reloading nginx..."
        sudo systemctl reload nginx
        echo "✓ Nginx reloaded"
    else
        echo "✗ Nginx config test failed. Restoring backup..."
        if [ -f /etc/nginx/sites-available/default.backup.* ]; then
            sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default
        fi
        exit 1
    fi
else
    echo "✗ Current nginx config is invalid. Please fix manually."
    exit 1
fi

echo "Cleaning up..."
rm -rf "\$EXTRACT_DIR"
rm -f "\${SERVER_HOME}/\${PACKAGE_NAME}"

echo "=== Deployment Complete ==="
echo "Frontend: \${SERVER_HOME}/build"
echo "Backend: \${SERVER_HOME}/backend"
echo ""
echo "Note: You may need to restart your backend service manually:"
echo "  systemctl restart your-backend-service"
echo "  or"
echo "  cd \${SERVER_HOME}/backend && python3 -m uvicorn main:app --host 127.0.0.1 --port 8000"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo ""
    echo "Cleaning up local package..."
    rm -f "$PACKAGE_PATH"
    echo -e "${GREEN}✓ Local package removed${NC}"
else
    echo -e "${RED}✗ Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi

echo ""
echo "=== Deployment Complete ==="
