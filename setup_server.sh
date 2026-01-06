#!/bin/bash
# Server setup script for Gator Tutor deployment

set -e

echo "=== Starting Server Setup ==="

# Update system
echo "1. Updating system packages..."
sudo apt update

# Install Python and dependencies
echo "2. Installing Python..."
sudo apt install -y python3 python3-pip python3-venv

# Install Nginx
echo "3. Installing Nginx..."
sudo apt install -y nginx

# Install MySQL
echo "4. Installing MySQL..."
sudo DEBIAN_FRONTEND=noninteractive apt install -y mysql-server

# Install Node.js (for potential future use)
echo "5. Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
echo ""
echo "=== Verifying Installations ==="
python3 --version
pip3 --version
nginx -v
mysql --version
node --version
npm --version

# Setup MySQL database
echo ""
echo "6. Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS team08_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'team08'@'localhost' IDENTIFIED BY 'CSC648Team08Password!';"
sudo mysql -e "GRANT ALL PRIVILEGES ON team08_db.* TO 'team08'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo ""
echo "=== Setup Complete ==="
echo "Python: $(python3 --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo "MySQL: $(mysql --version)"
echo "Node: $(node --version)"
echo ""
echo "Directory structure:"
ls -la /home/addy/
