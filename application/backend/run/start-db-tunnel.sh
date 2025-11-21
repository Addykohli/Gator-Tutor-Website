#!/bin/bash
# SSH Tunnel Helper Script for Team 08 Database Access
# This script establishes an SSH tunnel to the production database server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="3.101.155.82"
LOCAL_PORT="3306"
REMOTE_PORT="3306"
SSH_KEY_PATH="${HOME}/.ssh/csc648-team-08-key.pem"

# Determine SSH username (default to current user if not provided)
SSH_USER="${1:-$USER}"

echo -e "${YELLOW}Team 08 Database SSH Tunnel${NC}"
echo "================================"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${RED}ERROR: SSH key not found at $SSH_KEY_PATH${NC}"
    echo ""
    echo "Please ensure you have the team SSH key installed."
    echo "The key should be located in the credentials/access_keys folder of the repository."
    echo ""
    echo "To install:"
    echo "  cp ../../credentials/access_keys/csc648-team-08-key.pem ~/.ssh/"
    echo "  chmod 600 ~/.ssh/csc648-team-08-key.pem"
    exit 1
fi

# Check if port is already in use
if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PID=$(lsof -ti:$LOCAL_PORT)
    PROCESS_NAME=$(ps -p $PID -o comm=)
    
    echo -e "${YELLOW}WARNING: Port $LOCAL_PORT is already in use by process: $PROCESS_NAME (PID: $PID)${NC}"
    
    if [[ "$PROCESS_NAME" == *"mysqld"* ]]; then
        echo -e "${RED}CRITICAL ERROR: Local MySQL server is running!${NC}"
        echo "You MUST stop your local MySQL service for the tunnel to work."
        echo ""
        echo "Run one of these commands:"
        echo "  • Mac:     brew services stop mysql"
        echo "  • Linux:   sudo systemctl stop mysql"
        echo "  • Windows: Stop 'MySQL' in Services app"
        echo ""
        exit 1
    else
        echo "It looks like an old tunnel or random process. Killing it..."
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
fi

echo -e "${GREEN}Establishing SSH tunnel...${NC}"
echo "Server: $SSH_USER@$SERVER_IP"
echo "Local Port: $LOCAL_PORT -> Remote Port: $REMOTE_PORT"
echo ""
echo -e "${YELLOW}Press Ctrl+C to close the tunnel${NC}"
echo ""

# Establish SSH tunnel
# -N: Don't execute remote command
# -L: Local port forwarding
# -o ServerAliveInterval=60: Keep connection alive
# -o ServerAliveCountMax=3: Retry 3 times before giving up
ssh -N \
    -L ${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT} \
    -i "$SSH_KEY_PATH" \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    -o StrictHostKeyChecking=no \
    ${SSH_USER}@${SERVER_IP}
