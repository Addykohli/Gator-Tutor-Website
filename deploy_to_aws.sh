#!/bin/bash
# Quick deployment script for AWS

set -e

echo "=== Deploying to AWS Server ==="

# Package backend (exclude venv and cache)
echo "1. Packaging backend..."
cd application/backend
tar --exclude='.venv' --exclude='venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='.pytest_cache' --exclude='multimedia' -czf ../../backend-deploy.tar.gz .
cd ../..

# Package frontend source (we'll build on server)
echo "2. Packaging frontend..."
cd application/client
tar --exclude='node_modules' --exclude='build' -czf ../../frontend-source.tar.gz .
cd ../..

# Upload to server
echo "3. Uploading to server..."
scp -i SecondEC2Key.pem backend-deploy.tar.gz frontend-source.tar.gz ubuntu@18.220.232.53:~/

# Deploy on server
echo "4. Deploying on server..."
ssh -i SecondEC2Key.pem ubuntu@18.220.232.53 << 'ENDSSH'
set -e

# Move files to correct location
echo "Extracting backend..."
sudo mkdir -p /home/addy/csc648-fa25-145-team08/application/backend
cd /home/addy/csc648-fa25-145-team08/application/backend
sudo tar -xzf ~/backend-deploy.tar.gz
sudo chown -R addy:addy .

echo "Extracting frontend..."
sudo mkdir -p /home/addy/csc648-fa25-145-team08/application/client
cd /home/addy/csc648-fa25-145-team08/application/client
sudo tar -xzf ~/frontend-source.tar.gz
sudo chown -R addy:addy .

# Setup backend virtual environment
echo "Setting up Python virtual environment..."
cd /home/addy/csc648-fa25-145-team08/application/backend
sudo -u addy python3 -m venv .venv
sudo -u addy .venv/bin/pip install --upgrade pip
sudo -u addy .venv/bin/pip install -r requirements.txt

# Install Node.js dependencies and build frontend
echo "Installing Node.js dependencies..."
cd /home/addy/csc648-fa25-145-team08/application/client
sudo -u addy npm install

echo "Building frontend..."
sudo -u addy npm run build

# Set permissions
sudo chown -R addy:addy /home/addy/csc648-fa25-145-team08
sudo chmod -R 755 /home/addy/csc648-fa25-145-team08/application/client/build

# Cleanup
rm ~/backend-deploy.tar.gz ~/frontend-source.tar.gz

echo "=== Deployment Complete ==="
ENDSSH

# Cleanup local files
rm backend-deploy.tar.gz frontend-source.tar.gz

echo ""
echo "✅ Deployment successful!"
echo ""
echo "Next steps:"
echo "1. Create .env file on server"
echo "2. Run database migrations"
echo "3. Start services"
