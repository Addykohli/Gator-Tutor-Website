#!/bin/bash
# Collect server information and output as JSON/YAML for use in routes.yaml

echo "Collecting server information..."
echo ""

# Initialize output
OUTPUT="{"

# Get nginx root path
NGINX_ROOT=""
if [ -f /etc/nginx/sites-available/default ]; then
    NGINX_ROOT=$(grep -E "^\s*root\s+" /etc/nginx/sites-available/default | head -1 | awk '{print $2}' | tr -d ';')
fi

if [ -z "$NGINX_ROOT" ]; then
    # Try to find build directory in home
    NGINX_ROOT=$(find $HOME -maxdepth 2 -type d -name "build" 2>/dev/null | head -1)
fi

if [ -z "$NGINX_ROOT" ]; then
    NGINX_ROOT="$HOME/build"
fi

OUTPUT="${OUTPUT}\"static_root\": \"${NGINX_ROOT}\","

# Get backend port
BACKEND_PORT="8000"
BACKEND_PID=$(pgrep -f "uvicorn\|gunicorn\|python.*main:app" | head -1)
if [ -n "$BACKEND_PID" ]; then
    PORT=$(netstat -tlnp 2>/dev/null | grep $BACKEND_PID | grep LISTEN | awk '{print $4}' | cut -d: -f2 | head -1)
    if [ -n "$PORT" ]; then
        BACKEND_PORT="$PORT"
    fi
fi

OUTPUT="${OUTPUT}\"backend_port\": ${BACKEND_PORT},"

# Get server name/IP
SERVER_NAME=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_NAME" ]; then
    SERVER_NAME="3.101.155.82"
fi

OUTPUT="${OUTPUT}\"server_name\": \"${SERVER_NAME}\""

OUTPUT="${OUTPUT}}"

# Output as JSON
echo "$OUTPUT" | python3 -m json.tool 2>/dev/null || echo "$OUTPUT"

echo ""
echo "Suggested routes.yaml server section:"
echo "server:"
echo "  static_root: ${NGINX_ROOT}"
echo "  backend_host: 127.0.0.1"
echo "  backend_port: ${BACKEND_PORT}"
echo "  server_name: ${SERVER_NAME}"
