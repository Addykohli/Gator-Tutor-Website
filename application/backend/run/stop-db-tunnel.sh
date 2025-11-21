#!/bin/bash
# Stop SSH Tunnel Script for Team 08 Database Access
# This script kills any SSH tunnels running on port 3306

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Database SSH Tunnel${NC}"
echo "================================"
echo ""

# Check if port 3306 is in use
if ! lsof -Pi :3306 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}No SSH tunnel found on port 3306${NC}"
    echo "The tunnel may already be stopped."
    exit 0
fi

# Get process info
PIDS=$(lsof -ti:3306)
echo "Found processes using port 3306:"
lsof -i :3306 | grep LISTEN || true
echo ""

# Kill the processes
echo -e "${GREEN}Stopping SSH tunnel...${NC}"
lsof -ti:3306 | xargs kill -9 2>/dev/null || true

# Wait a moment and verify
sleep 1

if ! lsof -Pi :3306 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}✓ SSH tunnel stopped successfully${NC}"
else
    echo -e "${RED}✗ Failed to stop SSH tunnel${NC}"
    echo "You may need to manually kill the process."
    exit 1
fi
