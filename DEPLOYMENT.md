# Deployment Guide - The Gator Tutor

## Production Server Information

**Server IP:** `3.101.155.82`  
**OS:** Ubuntu 22.04 LTS  
**Web Server:** Nginx  
**Application Server:** Uvicorn (FastAPI)  
**Database:** MySQL 8.0  

---

## Architecture Overview

```
Internet → Nginx (Port 80) → FastAPI (Unix Socket) → MySQL (localhost:3306)
                ↓
         Static Files (/var/www)
         Media Files (/home/atharva/media)
```

---

## Directory Structure on Server

### Frontend 
- **Location:** `/home/atharva/csc648-fa25-145-team08/application/client/build`
- **Served by:** Nginx
- **URL:** `http://3.101.155.82/`

### Backend (FastAPI Application)
- **Location:** `/home/atharva/csc648-fa25-145-team08/application/backend`
- **Virtual Environment:** `/home/atharva/csc648-fa25-145-team08/application/backend/.venv`
- **Service:** `uvicorn-team08.service` (systemd)
- **Socket:** `/run/uvicorn-team08/uvicorn-team08.sock`
- **URL:** `http://3.101.155.82/api/*`

### Media Files
- **Location:** `/home/atharva/media/`
- **Served by:** Nginx (direct file serving)
- **URL:** `http://3.101.155.82/media/*`
- **Subdirectories:**
  - `/home/atharva/media/photos/` - Images
  - `/home/atharva/media/videos/` - Videos
  - `/home/atharva/media/pdfs/` - PDF files
  - `/home/atharva/media/default_silhouette.png` - Default profile image

### Database
- **Host:** `localhost` (on the server)
- **Port:** `3306`
- **Database Name:** `team08_db`
- **User:** `team08`
- **Connection:** SSH tunnel required for remote access

### Nginx Configuration
- **Config File:** `/etc/nginx/sites-available/team08`
- **Symlink:** `/etc/nginx/sites-enabled/team08`
- **Generated From:** `/home/atharva/csc648-fa25-145-team08/application/backend/scripts/generate_nginx_config.py`

### Backups
- **Location:** `/home/atharva/backup_2/`
- **Contents:**
  - `backend_YYYYMMDD_HHMMSS.tar.gz`
  - `frontend_YYYYMMDD_HHMMSS.tar.gz`
  - `nginx_team08_YYYYMMDD_HHMMSS`

---

## Deployment Process

### Prerequisites
1. SSH access to the server
2. SSH key: `credentials/access_keys/csc648-team-08-key.pem`
3. Node.js and npm installed locally
4. Python 3.10+ with venv

### Step 1: Build Frontend Locally

```bash
cd application/client
npm run build
```

This creates an optimized production build in `application/client/build/`.

### Step 2: Package Backend Locally

```bash
cd application/backend
tar --exclude='.venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='.pytest_cache' -czf ../../backend-deploy.tar.gz .
```

### Step 3: Package Frontend Locally

```bash
cd application/client/build
tar -czf ../../../frontend-deploy.tar.gz .
```

### Step 4: Upload to Server

```bash
# From project root
scp -i credentials/access_keys/csc648-team-08-key.pem backend-deploy.tar.gz ubuntu@3.101.155.82:~/
scp -i credentials/access_keys/csc648-team-08-key.pem frontend-deploy.tar.gz ubuntu@3.101.155.82:~/
```

### Step 5: Deploy Backend on Server

```bash
ssh -i credentials/access_keys/csc648-team-08-key.pem ubuntu@3.101.155.82

# Extract backend
cd /home/atharva/csc648-fa25-145-team08/application/backend
sudo tar -xzf ~/backend-deploy.tar.gz
sudo chown -R atharva:atharva .

# Restart backend service
sudo systemctl restart uvicorn-team08.service

# Cleanup
rm ~/backend-deploy.tar.gz
```

### Step 6: Deploy Frontend on Server

```bash
# Still on server
TARGET_DIR="/home/atharva/csc648-fa25-145-team08/application/client/build"
sudo rm -rf "$TARGET_DIR"/*
sudo tar -xzf ~/frontend-deploy.tar.gz -C "$TARGET_DIR"
sudo chown -R atharva:atharva "$TARGET_DIR"
sudo chmod -R 755 "$TARGET_DIR"

# Reload Nginx
sudo systemctl reload nginx

# Cleanup
rm ~/frontend-deploy.tar.gz
```

### Step 7: Verify Deployment

```bash
# Check backend service status
sudo systemctl status uvicorn-team08.service

# Check Nginx status
sudo systemctl status nginx

# Test endpoints
curl http://3.101.155.82/api/health
curl http://3.101.155.82/
```

---

## Environment Variables

### Backend `.env` File
**Location:** `/home/atharva/csc648-fa25-145-team08/application/backend/.env`

**Required Variables:**
```bash
# OpenRouter AI API Key
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-oss-20b

# Database (uses default from config.py)
# DATABASE_URL=mysql+pymysql://team08:password@localhost:3306/team08_db
```

**Important:** The `.env` file is **NOT** in git (gitignored). It must be manually created or uploaded during deployment.

**Permissions:**
```bash
sudo chmod 644 /home/atharva/csc648-fa25-145-team08/application/backend/.env
sudo chown atharva:atharva /home/atharva/csc648-fa25-145-team08/application/backend/.env
```

---

## Service Management

### Backend Service (Uvicorn)

**Service File:** `/etc/systemd/system/uvicorn-team08.service`

```bash
# Start service
sudo systemctl start uvicorn-team08.service

# Stop service
sudo systemctl stop uvicorn-team08.service

# Restart service
sudo systemctl restart uvicorn-team08.service

# Check status
sudo systemctl status uvicorn-team08.service

# View logs
sudo journalctl -u uvicorn-team08.service -f
```

### Nginx

```bash
# Test configuration
sudo nginx -t

# Reload configuration (no downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Nginx Configuration Details

### Routes Handled by Nginx

1. **Frontend (React App)**
   - Path: `/`
   - Serves from: `/home/atharva/csc648-fa25-145-team08/application/client/build`
   - Fallback: `index.html` (for React Router)

2. **API Routes**
   - Path: `/api/*`
   - Proxies to: `unix:/run/uvicorn-team08/uvicorn-team08.sock`
   - Includes: `/api/search`, `/api/schedule`, `/api/chat`, `/api/admin`, `/api/ai`

3. **Media Files**
   - Path: `/media/*`
   - Serves from: `/home/atharva/media/`
   - Cache: 30 days
   - Direct file serving (no backend involved)

4. **Health Checks**
   - Path: `/health`, `/healthz`
   - Proxies to backend

### Regenerating Nginx Configuration

```bash
cd /home/atharva/csc648-fa25-145-team08/application/backend
sudo -u atharva .venv/bin/python scripts/generate_nginx_config.py

# Copy to Nginx
sudo cp deployment/nginx.conf /etc/nginx/sites-available/team08

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## Database Access

### From Server (Local)

```bash
mysql -h localhost -u team08 -p team08_db
# Password: CSC648Team08Password!
```

### From Local Machine (SSH Tunnel)

```bash
# Create SSH tunnel
ssh -i credentials/access_keys/csc648-team-08-key.pem -L 3306:127.0.0.1:3306 ubuntu@3.101.155.82 -N

# In another terminal, connect to database
mysql -h 127.0.0.1 -P 3306 -u team08 -p team08_db
```

---

## Troubleshooting

### Backend Not Responding

```bash
# Check if service is running
sudo systemctl status uvicorn-team08.service

# Check logs for errors
sudo journalctl -u uvicorn-team08.service -n 50

# Restart service
sudo systemctl restart uvicorn-team08.service
```

### Frontend Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /home/atharva/csc648-fa25-145-team08/application/client/build/

# Check Nginx configuration
sudo nginx -t
```

### Media Files Not Loading

```bash
# Check media directory permissions
ls -la /home/atharva/media/

# Ensure Nginx can read files
sudo chmod -R 755 /home/atharva/media/

# Check Nginx configuration for /media/ location
sudo cat /etc/nginx/sites-available/team08 | grep -A 10 "location /media/"
```

### Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Check if MySQL is listening
sudo netstat -tlnp | grep 3306

# Test connection
mysql -h localhost -u team08 -p team08_db
```

### AI Features Not Working

```bash
# Check if .env file exists and has correct permissions
ls -la /home/atharva/csc648-fa25-145-team08/application/backend/.env

# Verify API key is loaded
sudo journalctl -u uvicorn-team08.service | grep -i openrouter

# Test AI endpoint
curl http://3.101.155.82/api/ai/health
```

---

## Rollback Procedure

If a deployment fails, you can restore from backups:

```bash
# Stop services
sudo systemctl stop uvicorn-team08.service

# Restore backend
cd /home/atharva/csc648-fa25-145-team08/application/backend
sudo rm -rf *
sudo tar -xzf /home/atharva/backup_2/backend_YYYYMMDD_HHMMSS.tar.gz
sudo chown -R atharva:atharva .

# Restore frontend
TARGET_DIR="/home/atharva/csc648-fa25-145-team08/application/client/build"
sudo rm -rf "$TARGET_DIR"/*
sudo tar -xzf /home/atharva/backup_2/frontend_YYYYMMDD_HHMMSS.tar.gz -C "$TARGET_DIR"
sudo chown -R atharva:atharva "$TARGET_DIR"

# Restore Nginx config
sudo cp /home/atharva/backup_2/nginx_team08_YYYYMMDD_HHMMSS /etc/nginx/sites-available/team08

# Restart services
sudo systemctl start uvicorn-team08.service
sudo nginx -t && sudo systemctl reload nginx
```

---

## Security Notes

1. **SSH Key:** Keep `csc648-team-08-key.pem` secure and never commit to git
2. **`.env` File:** Never commit to git, contains sensitive API keys
3. **Database Password:** Stored in backend config, not exposed to frontend
4. **File Permissions:** Media files are world-readable (755), backend code is not (owned by atharva)
5. **Nginx:** Configured to prevent directory listing and access to hidden files

---

## Performance Optimization

### Frontend
- Production build is minified and optimized
- Static assets cached by browser
- Gzip compression enabled in Nginx

### Backend
- Uvicorn runs with 2 workers for concurrency
- Unix socket communication (faster than TCP)
- Database connection pooling

### Media
- Direct file serving by Nginx (no backend overhead)
- 30-day cache headers for media files
- Efficient file organization by type

---

## Monitoring

### Check System Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Check specific directory
du -sh /home/atharva/media/
```

### Check Application Logs

```bash
# Backend logs (last 100 lines)
sudo journalctl -u uvicorn-team08.service -n 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Quick Reference Commands

```bash
# Full deployment (from local machine)
cd application/client && npm run build
cd ../backend && tar --exclude='.venv' --exclude='__pycache__' -czf ../../backend.tar.gz .
cd ../client/build && tar -czf ../../../frontend.tar.gz .
cd ../../..
scp -i credentials/access_keys/csc648-team-08-key.pem backend.tar.gz frontend.tar.gz ubuntu@3.101.155.82:~/

# On server
ssh -i credentials/access_keys/csc648-team-08-key.pem ubuntu@3.101.155.82
cd /home/atharva/csc648-fa25-145-team08/application/backend && sudo tar -xzf ~/backend.tar.gz && sudo chown -R atharva:atharva .
cd ../client/build && sudo rm -rf * && sudo tar -xzf ~/frontend.tar.gz && sudo chown -R atharva:atharva .
sudo systemctl restart uvicorn-team08.service && sudo systemctl reload nginx
```

---

## Contact Information

**Server Access:** Contact team lead for SSH key  
**Database Access:** Contact team lead for credentials  
**API Keys:** Stored in team's secure documentation  

---

*Last Updated: December 16, 2025*
