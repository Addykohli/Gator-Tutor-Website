#!/bin/bash
# Server audit script to identify current nginx config, static file paths, and backend setup

echo "=== Server Audit Script ==="
echo ""

# Check nginx status
echo "1. Nginx Status:"
if systemctl is-active --quiet nginx; then
    echo "   ✓ Nginx is running"
else
    echo "   ✗ Nginx is not running"
fi
echo ""

# Find nginx config files
echo "2. Nginx Configuration Files:"
if [ -f /etc/nginx/sites-available/default ]; then
    echo "   Found: /etc/nginx/sites-available/default"
    echo "   Static root path:"
    grep -E "^\s*root\s+" /etc/nginx/sites-available/default | head -1 || echo "   (not found)"
fi

if [ -f /etc/nginx/nginx.conf ]; then
    echo "   Found: /etc/nginx/nginx.conf"
fi

# Check for other site configs
if [ -d /etc/nginx/sites-enabled ]; then
    echo "   Enabled sites:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "   (none)"
fi
echo ""

# Check backend process
echo "3. Backend Process:"
BACKEND_PID=$(pgrep -f "uvicorn\|gunicorn\|python.*main:app" | head -1)
if [ -n "$BACKEND_PID" ]; then
    echo "   ✓ Backend process found (PID: $BACKEND_PID)"
    echo "   Command:"
    ps -p $BACKEND_PID -o cmd= | head -1
    echo "   Port:"
    netstat -tlnp 2>/dev/null | grep $BACKEND_PID | grep LISTEN || ss -tlnp | grep $BACKEND_PID | grep LISTEN
else
    echo "   ✗ No backend process found"
fi
echo ""

# Check home directory structure
echo "4. Home Directory Structure:"
echo "   Current user: $(whoami)"
echo "   Home directory: $HOME"
echo "   Contents:"
ls -lah $HOME | grep -E "^d" | awk '{print "   " $9 " (" $5 ")"}'
echo ""

# Find build directories
echo "5. Build Directories:"
find $HOME -maxdepth 2 -type d -name "build" -o -name "*build*" 2>/dev/null | while read dir; do
    if [ -d "$dir" ]; then
        echo "   $dir ($(du -sh "$dir" 2>/dev/null | cut -f1))"
    fi
done
echo ""

# Find tar.gz files
echo "6. Deployment Archives (tar.gz):"
find $HOME -maxdepth 1 -type f -name "*.tar.gz" -o -name "*.tgz" 2>/dev/null | while read file; do
    if [ -f "$file" ]; then
        echo "   $file ($(du -sh "$file" 2>/dev/null | cut -f1) - $(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1))"
    fi
done
echo ""

# Check disk usage
echo "7. Disk Usage:"
df -h $HOME | tail -1 | awk '{print "   Available: " $4 " / " $2 " (Used: " $5 ")"}'
echo ""

# Check nginx root directive
echo "8. Current Nginx Root Directive:"
if [ -f /etc/nginx/sites-available/default ]; then
    ROOT_PATH=$(grep -E "^\s*root\s+" /etc/nginx/sites-available/default | head -1 | awk '{print $2}' | tr -d ';')
    if [ -n "$ROOT_PATH" ]; then
        echo "   Root: $ROOT_PATH"
        if [ -d "$ROOT_PATH" ]; then
            echo "   ✓ Directory exists"
            echo "   Contents: $(ls -1 "$ROOT_PATH" | wc -l) items"
        else
            echo "   ✗ Directory does not exist"
        fi
    fi
fi
echo ""

echo "=== Audit Complete ==="
