# Server Setup Complete - Summary

## ✅ What Has Been Done

### 1. Server Configuration
- **IP Address**: `18.220.232.53`
- **SSH Key**: `SecondEC2Key.pem` (located in project root)
- **OS**: Ubuntu 24.04 LTS

### 2. User Setup
- Created user: `addy`
- Added to sudo group
- Home directory: `/home/addy`

### 3. Directory Structure Created
```
/home/addy/
├── csc648-fa25-145-team08/
│   └── application/
│       ├── backend/          # Backend code will go here
│       └── client/
│           └── build/        # Frontend build will go here
└── media/                    # Media files served by Nginx
    ├── photos/
    │   ├── profile/          # Profile photos
    │   └── chat/             # Chat photos
    ├── videos/
    │   └── chat/             # Chat videos
    └── pdfs/
        └── chat/             # Chat PDFs
```

### 4. Software Installed
- ✅ Python 3.12.3
- ✅ Nginx 1.24.0
- ✅ MySQL 8.0.44
- ✅ Node.js 18.20.8
- ✅ pip3 and python3-venv

### 5. Database Setup
- Database: `team08_db`
- User: `team08`
- Password: `CSC648Team08Password!`
- Host: `localhost`

### 6. Services Configured
- ✅ Systemd service: `uvicorn-team08.service`
- ✅ Nginx configuration: `/etc/nginx/sites-available/team08`
- ✅ Socket directory: `/run/uvicorn-team08/`

### 7. Code Updates
All references to "atharva" have been replaced with "addy" in:
- ✅ DEPLOYMENT.md
- ✅ deploy.sh
- ✅ media_handling/service.py
- ✅ All configuration files

## 📋 Next Steps to Deploy

### Step 1: Build and Deploy Frontend
```bash
# On your local machine, in the project root
cd application/client
npm install
npm run build
```

### Step 2: Create Backend Virtual Environment and Install Dependencies
```bash
# SSH into the server
ssh -i SecondEC2Key.pem ubuntu@18.220.232.53

# Switch to addy user
sudo su - addy

# Navigate to backend directory
cd /home/addy/csc648-fa25-145-team08/application/backend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install dependencies (you'll need to upload requirements.txt first)
pip install -r requirements.txt

# Exit back to ubuntu user
exit
exit
```

### Step 3: Upload Application Code
```bash
# From your local machine, in project root

# Package backend (excluding venv and cache)
cd application/backend
tar --exclude='.venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='.pytest_cache' -czf ../../backend-deploy.tar.gz .
cd ../..

# Package frontend build
cd application/client/build
tar -czf ../../../frontend-deploy.tar.gz .
cd ../../..

# Upload to server
scp -i SecondEC2Key.pem backend-deploy.tar.gz ubuntu@18.220.232.53:~/
scp -i SecondEC2Key.pem frontend-deploy.tar.gz ubuntu@18.220.232.53:~/
```

### Step 4: Extract and Deploy on Server
```bash
# SSH into server
ssh -i SecondEC2Key.pem ubuntu@18.220.232.53

# Deploy backend
cd /home/addy/csc648-fa25-145-team08/application/backend
sudo tar -xzf ~/backend-deploy.tar.gz
sudo chown -R addy:addy .

# Deploy frontend
cd /home/addy/csc648-fa25-145-team08/application/client/build
sudo tar -xzf ~/frontend-deploy.tar.gz
sudo chown -R addy:addy .
sudo chmod -R 755 .

# Cleanup
rm ~/backend-deploy.tar.gz ~/frontend-deploy.tar.gz
```

### Step 5: Create .env File
```bash
# On the server
sudo nano /home/addy/csc648-fa25-145-team08/application/backend/.env
```

Add the following content:
```bash
# OpenRouter AI API Key
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_MODEL=openai/gpt-4o-mini

# Database (optional, uses default from config.py)
# DATABASE_URL=mysql+pymysql://team08:CSC648Team08Password!@localhost:3306/team08_db
```

Set permissions:
```bash
sudo chmod 644 /home/addy/csc648-fa25-145-team08/application/backend/.env
sudo chown addy:addy /home/addy/csc648-fa25-145-team08/application/backend/.env
```

### Step 6: Initialize Database
```bash
# SSH into server
ssh -i SecondEC2Key.pem ubuntu@18.220.232.53

# Run database migrations
cd /home/addy/csc648-fa25-145-team08/application/backend
sudo -u addy .venv/bin/python -m alembic upgrade head
```

### Step 7: Start Services
```bash
# Start and enable backend service
sudo systemctl enable uvicorn-team08.service
sudo systemctl start uvicorn-team08.service

# Check status
sudo systemctl status uvicorn-team08.service

# Start Nginx
sudo systemctl enable nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Step 8: Verify Deployment
```bash
# Test backend health
curl http://18.220.232.53/api/health

# Test frontend
curl http://18.220.232.53/

# Check logs
sudo journalctl -u uvicorn-team08.service -f
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Useful Commands

### Service Management
```bash
# Restart backend
sudo systemctl restart uvicorn-team08.service

# View backend logs
sudo journalctl -u uvicorn-team08.service -f

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# Test Nginx config
sudo nginx -t
```

### File Permissions
```bash
# Fix media permissions
sudo chmod -R 755 /home/addy/media/
sudo chown -R addy:addy /home/addy/media/

# Fix application permissions
sudo chown -R addy:addy /home/addy/csc648-fa25-145-team08/
```

### Database Access
```bash
# Local access on server
mysql -h localhost -u team08 -p team08_db

# Remote access via SSH tunnel (from your local machine)
ssh -i SecondEC2Key.pem -L 3306:127.0.0.1:3306 ubuntu@18.220.232.53 -N
# Then in another terminal:
mysql -h 127.0.0.1 -P 3306 -u team08 -p team08_db
```

## 📝 Important Notes

1. **SSH Key**: The `SecondEC2Key.pem` must be kept secure and should NOT be committed to git
2. **Environment Variables**: The `.env` file contains sensitive API keys and should NOT be committed to git
3. **Media Files**: Uploaded media files are stored in `/home/addy/media/` and served directly by Nginx at `/media/`
4. **Database**: MySQL is running locally on the server and requires SSH tunnel for remote access
5. **Logs**: Backend logs are available via `journalctl`, Nginx logs are in `/var/log/nginx/`

## 🚀 Access Your Application

Once deployed, your application will be available at:
- **Frontend**: http://18.220.232.53/
- **API**: http://18.220.232.53/api/
- **Media**: http://18.220.232.53/media/
- **Health Check**: http://18.220.232.53/api/health

## ❓ Troubleshooting

If something doesn't work:
1. Check backend service: `sudo systemctl status uvicorn-team08.service`
2. Check backend logs: `sudo journalctl -u uvicorn-team08.service -n 50`
3. Check Nginx status: `sudo systemctl status nginx`
4. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
5. Verify file permissions: `ls -la /home/addy/csc648-fa25-145-team08/`
6. Test Nginx config: `sudo nginx -t`
