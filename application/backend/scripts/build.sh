#!/bin/bash
# Build script: Builds frontend, generates nginx config, and prepares deployment package

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/.." && pwd)"
CLIENT_DIR="$PROJECT_ROOT/client"
BUILD_DIR="$PROJECT_ROOT/build"
DEPLOYMENT_DIR="$BACKEND_DIR/deployment"

echo "=== Building Application ==="
echo ""

# Step 1: Build React frontend
echo "1. Building React frontend..."
cd "$CLIENT_DIR"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi
npm run build
echo "   ✓ Frontend build complete"
echo ""

# Step 2: Generate nginx config
echo "2. Generating nginx configuration..."
cd "$BACKEND_DIR"
if [ ! -f "routes.yaml" ]; then
    echo "   ✗ Error: routes.yaml not found"
    exit 1
fi

# Check if Python dependencies are installed
python3 -c "import jinja2, yaml" 2>/dev/null || {
    echo "   Installing Python dependencies..."
    pip3 install jinja2 pyyaml 2>/dev/null || {
        echo "   ✗ Error: Could not install jinja2 and pyyaml"
        echo "   Please run: pip3 install jinja2 pyyaml"
        exit 1
    }
}

# Generate nginx config
python3 scripts/generate_nginx_config.py
if [ $? -ne 0 ]; then
    echo "   ✗ Error generating nginx config"
    exit 1
fi
echo "   ✓ Nginx config generated"
echo ""

# Step 3: Prepare deployment structure
echo "3. Preparing deployment structure..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy frontend build
echo "   Copying frontend build..."
cp -r "$CLIENT_DIR/build" "$BUILD_DIR/frontend"

# Copy backend code (excluding unnecessary files)
echo "   Copying backend code..."
mkdir -p "$BUILD_DIR/backend"
rsync -av --exclude='.venv' \
         --exclude='__pycache__' \
         --exclude='*.pyc' \
         --exclude='.env' \
         --exclude='.git' \
         "$BACKEND_DIR/" "$BUILD_DIR/backend/"

# Copy nginx config
echo "   Copying nginx config..."
cp "$DEPLOYMENT_DIR/nginx.conf" "$BUILD_DIR/nginx.conf"

# Create deployment info file
echo "   Creating deployment info..."
cat > "$BUILD_DIR/DEPLOYMENT_INFO.txt" << EOF
Deployment Package
==================
Generated: $(date)
Frontend: React build from client/
Backend: FastAPI application
Nginx Config: Generated from routes.yaml

Structure:
- frontend/     : React build files (copy to static_root)
- backend/     : Backend application code
- nginx.conf   : Nginx configuration file

To deploy:
1. Extract this package on the server
2. Copy frontend/ contents to static_root directory
3. Copy backend/ to server location
4. Copy nginx.conf to /etc/nginx/sites-available/your-site
5. Test nginx: sudo nginx -t
6. Reload nginx: sudo systemctl reload nginx
7. Restart backend service
EOF

echo "   ✓ Deployment structure prepared"
echo ""

echo "=== Build Complete ==="
echo "Deployment package ready in: $BUILD_DIR"
echo ""
