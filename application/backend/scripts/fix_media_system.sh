#!/bin/bash
# Script to fix media system on server:
# 1. Install python-multipart using uv
# 2. Regenerate nginx config from template
# 3. Restart services

set -e

BACKEND_DIR="/home/atharva/csc648-fa25-145-team08/application/backend"

echo "=== Fixing Media System on Server ==="
echo ""

# Step 1: Install python-multipart using uv
echo "1. Installing python-multipart..."
cd "$BACKEND_DIR"
if command -v uv &> /dev/null; then
    # Try with sudo if permission denied
    if uv pip install python-multipart 2>/dev/null; then
        echo "   ✓ Installed using uv"
    elif sudo uv pip install python-multipart; then
        echo "   ✓ Installed using uv (with sudo)"
    else
        echo "   ⚠ uv install failed, trying pip..."
        sudo "$BACKEND_DIR/.venv/bin/pip" install python-multipart || {
            echo "   ✗ Failed to install python-multipart"
            exit 1
        }
        echo "   ✓ Installed using pip (with sudo)"
    fi
else
    echo "   ⚠ uv not found, trying pip..."
    sudo "$BACKEND_DIR/.venv/bin/pip" install python-multipart || {
        echo "   ✗ Failed to install python-multipart"
        exit 1
    }
    echo "   ✓ Installed using pip (with sudo)"
fi

# Step 2: Regenerate nginx config (if routes.yaml exists)
echo ""
echo "2. Regenerating nginx config..."
if [ -f "$BACKEND_DIR/routes.yaml" ]; then
    cd "$BACKEND_DIR"
    python3 scripts/generate_nginx_config.py
    if [ -f "$BACKEND_DIR/deployment/nginx.conf" ]; then
        echo "   ✓ Nginx config generated"
        
        # Copy to nginx sites-enabled
        echo "   Updating nginx configuration..."
        sudo cp "$BACKEND_DIR/deployment/nginx.conf" /etc/nginx/sites-enabled/team08
        
        # Test nginx config
        if sudo nginx -t; then
            echo "   ✓ Nginx config valid"
            sudo systemctl reload nginx
            echo "   ✓ Nginx reloaded"
        else
            echo "   ✗ Nginx config invalid, not updating"
        fi
    else
        echo "   ⚠ Nginx config not generated, skipping nginx update"
    fi
else
    echo "   ⚠ routes.yaml not found, skipping nginx config generation"
fi

# Step 3: Restart backend
echo ""
echo "3. Restarting backend service..."
sudo systemctl restart uvicorn-team08
sleep 3

echo ""
echo "=== Verification ==="
echo "Backend health:"
curl -s http://localhost:8000/health && echo "" || echo "✗ Backend not responding"

echo ""
echo "=== Fix Complete ==="
echo "You can now test media uploads with:"
echo "  curl -X POST 'http://your-domain/api/chat/send-media?user_id=1' \\"
echo "    -F 'file=@/path/to/image.jpg' \\"
echo "    -F 'receiver_id=2' \\"
echo "    -F 'content=Test'"

