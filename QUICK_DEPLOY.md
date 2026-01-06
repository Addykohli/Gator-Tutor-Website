# Quick Deployment Reference Card (Updated)

## Server Details
- **IP**: 18.220.232.53
- **SSH Key**: SecondEC2Key.pem
- **User**: addy

## Recommended Deployment (Upload Local Build)
*Prevents server freeze by building locally*

### 1. Build Locally
```bash
# Build Frontend
cd application/client
npm install
npm run build
cd ../..
```

### 2. Package & Upload
```bash
# Package Frontend Build
tar -czf frontend-deploy.tar.gz -C application/client/build .

# Package Backend
tar --exclude='.venv' --exclude='__pycache__' --exclude='*.pyc' -czf backend-deploy.tar.gz -C application/backend .

# Upload to Server
scp -i SecondEC2Key.pem frontend-deploy.tar.gz backend-deploy.tar.gz ubuntu@18.220.232.53:~/
```

### 3. Deploy on Server
```bash
ssh -i SecondEC2Key.pem ubuntu@18.220.232.53 << 'EOF'
# Deploy Backend
sudo mkdir -p /home/addy/csc648-fa25-145-team08/application/backend
cd /home/addy/csc648-fa25-145-team08/application/backend
sudo tar -xzf ~/backend-deploy.tar.gz
sudo chown -R addy:addy .

# Deploy Frontend
sudo mkdir -p /home/addy/csc648-fa25-145-team08/application/client/build
cd /home/addy/csc648-fa25-145-team08/application/client/build
sudo rm -rf *
sudo tar -xzf ~/frontend-deploy.tar.gz
sudo chown -R addy:addy .
sudo chmod -R 755 .

# Restart Services
sudo systemctl restart uvicorn-team08.service
sudo systemctl reload nginx

# Cleanup
rm ~/frontend-deploy.tar.gz ~/backend-deploy.tar.gz
echo "Deployment Complete!"
EOF
```

## Check Status
```bash
ssh -i SecondEC2Key.pem ubuntu@18.220.232.53 "sudo systemctl status uvicorn-team08.service nginx"
```
