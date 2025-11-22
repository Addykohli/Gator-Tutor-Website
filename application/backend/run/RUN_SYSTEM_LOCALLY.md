# Running the System Locally - Team 08

Complete guide to run the frontend, backend, and database locally for development.

---

## ⚡ Quick Start (Already Set Up?)

```bash
# Terminal 1: Database Tunnel
cd application/backend
./run/start-db-tunnel.sh ubuntu

# Terminal 2: Backend
cd application/backend
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Terminal 3: Frontend
cd application/client
npm start
```

**Verify:**
- Frontend: http://localhost:3000
- Backend: http://127.0.0.1:8000/health
- API Docs: http://127.0.0.1:8000/docs

---

## 🎯 First-Time Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 16+** and **npm**
- **uv** package manager: `pip install uv`
- **Git** repository cloned

### Step 1: SSH Key Setup (Required for Database)

```bash
# Copy the team SSH key
cp credentials/access_keys/csc648-team-08-key.pem ~/.ssh/

# Set permissions (CRITICAL - SSH won't work without this)
chmod 600 ~/.ssh/csc648-team-08-key.pem

# Test the connection
ssh -i ~/.ssh/csc648-team-08-key.pem ubuntu@3.101.155.82 "echo 'Success!'"
```

**What this does:** Allows you to connect to the production server to access the database.

### Step 2: Backend Setup

```bash
cd application/backend

# Create virtual environment
uv venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install Python dependencies
uv pip install -r requirements.txt

# Create environment config
cp .env.example .env
```

### Step 3: Frontend Setup

```bash
cd application/client

# Install Node dependencies
npm install
```

**That's it!** You're ready to run the system.

---

## 🚀 Running the System

You need **3 terminals** running simultaneously:

### Terminal 1: Database Tunnel

```bash
cd application/backend
./run/start-db-tunnel.sh ubuntu
```

**What this does:**
- Creates an encrypted SSH tunnel to the production database
- Forwards port 3306 from the server to your laptop
- Makes the remote database appear as `localhost:3306`

**Keep this running!** Don't close this terminal while developing.

### Terminal 2: Backend API

```bash
cd application/backend
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**What this does:**
- Starts the FastAPI backend server
- Connects to the database via the SSH tunnel
- Enables hot-reload (auto-restarts when you edit code)

**Running at:** http://127.0.0.1:8000

### Terminal 3: Frontend

```bash
cd application/client
npm start
```

**What this does:**
- Starts the React development server
- Enables hot-reload for frontend changes

**Running at:** http://localhost:3000

---

## ✅ Verify Everything Works

### 1. Check Backend Health
```bash
curl http://127.0.0.1:8000/health
```
**Expected:** `{"status":"ok"}`

### 2. Check Database Connection
```bash
curl "http://127.0.0.1:8000/search/tutors?limit=1"
```
**Expected:** JSON with tutor data

### 3. Check Frontend
Open http://localhost:3000 in your browser.

### 4. Check SSH Tunnel
```bash
lsof -i :3306
```
**Expected:** Should show `ssh` process, NOT `mysqld`

---

## 🛠️ How It Works

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────────┐
│   Frontend      │         │   Backend    │         │  SSH Tunnel      │
│  localhost:3000 │────────▶│ localhost:   │────────▶│  Production DB   │
│   (React)       │   API   │   8000       │  Port   │  3.101.155.82    │
│                 │ Calls   │  (FastAPI)   │  3306   │                  │
└─────────────────┘         └──────────────┘         └──────────────────┘
```

1. **Frontend** makes API calls to the backend
2. **Backend** connects to `localhost:3306` (thinks DB is local)
3. **SSH Tunnel** forwards the connection to the production server
4. **Database** on the server responds back through the tunnel

---

## 🐛 Common Issues & Solutions

### Issue 1: "Port 3306 already in use"

**Cause:** You have MySQL installed locally and it's running.

**Solution:**
```bash
# Mac
brew services stop mysql

# Linux
sudo systemctl stop mysql

# Or use the cleanup script
cd application/backend
./run/stop-db-tunnel.sh
```

---

### Issue 2: "Permission denied (publickey)"

**Cause:** SSH key doesn't have correct permissions.

**Solution:**
```bash
chmod 600 ~/.ssh/csc648-team-08-key.pem
```

**Why:** SSH requires private keys to be readable only by the owner (security requirement).

---

### Issue 3: "Connection refused" from backend

**Cause:** SSH tunnel isn't running.

**Solution:**
1. Check if tunnel is running: `lsof -i :3306`
2. If nothing shows up, start it: `./run/start-db-tunnel.sh ubuntu`
3. Make sure you see `ssh` in the output, NOT `mysqld`

---

### Issue 4: "cryptography package required"

**Cause:** Missing Python dependency for MySQL authentication.

**Solution:**
```bash
cd application/backend
uv pip install cryptography
```

---

### Issue 5: Frontend can't connect to backend

**Cause:** Backend isn't running or wrong port.

**Solution:**
1. Check backend is running: `curl http://127.0.0.1:8000/health`
2. Check frontend is configured for correct backend URL
3. Look for CORS errors in browser console

---

### Issue 6: "Module not found" errors in backend

**Cause:** Virtual environment not activated or dependencies not installed.

**Solution:**
```bash
cd application/backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
```

---

### Issue 7: npm errors in frontend

**Cause:** Node modules not installed or outdated.

**Solution:**
```bash
cd application/client
rm -rf node_modules package-lock.json
npm install
```

---

## 🛑 Stopping Everything

### Quick Stop
Press `Ctrl+C` in each of the 3 terminals.

### Clean Stop
```bash
# Stop tunnel
cd application/backend
./run/stop-db-tunnel.sh

# Stop backend (Ctrl+C in Terminal 2)
# Stop frontend (Ctrl+C in Terminal 3)
```

---

## 📋 Useful Commands

### Check What's Running
```bash
# Check tunnel
lsof -i :3306

# Check backend
lsof -i :8000
curl http://127.0.0.1:8000/health

# Check frontend
lsof -i :3000
```

### View Logs
```bash
# Backend logs are in Terminal 2
# Frontend logs are in Terminal 3
# Tunnel status is in Terminal 1
```

### Test API Endpoints
```bash
# Health check
curl http://127.0.0.1:8000/health

# Search tutors
curl "http://127.0.0.1:8000/search/tutors?limit=5"

# Search courses
curl "http://127.0.0.1:8000/search/courses?limit=5"

# View interactive API docs
open http://127.0.0.1:8000/docs
```

---

## 📝 Important Notes

### Database Connection
- The database is **on the production server**, not local
- The SSH tunnel makes it appear local at `localhost:3306`
- Database credentials are in `application/backend/.env`
- **Never commit** the `.env` file (it's gitignored)

### Development Workflow
1. Always start the tunnel first (Terminal 1)
2. Then start backend (Terminal 2)
3. Then start frontend (Terminal 3)
4. Keep all 3 terminals running while developing

### Hot Reload
- **Backend:** Auto-reloads when you edit Python files
- **Frontend:** Auto-reloads when you edit React files
- **Database changes:** Require backend restart

### Ports Used
- **3000:** Frontend (React)
- **3306:** Database tunnel (SSH)
- **8000:** Backend (FastAPI)

---

## 🆘 Still Having Issues?

1. **Check all 3 terminals are running**
2. **Verify SSH tunnel:** `lsof -i :3306` should show `ssh`
3. **Check backend health:** `curl http://127.0.0.1:8000/health`
4. **Check browser console** for frontend errors
5. **Ask in team chat** or contact Atharva (backend lead)

### Debug Checklist
- [ ] SSH key is in `~/.ssh/` with `chmod 600` permissions
- [ ] Tunnel is running (Terminal 1)
- [ ] Backend is running (Terminal 2)
- [ ] Frontend is running (Terminal 3)
- [ ] No port conflicts (3000, 3306, 8000)
- [ ] Virtual environment is activated for backend
- [ ] Node modules are installed for frontend

---

## 📚 Additional Resources

- **Backend README:** `application/backend/README.md`
- **Frontend README:** `application/client/README.md`
- **API Documentation:** http://127.0.0.1:8000/docs (when backend is running)
- **Database Credentials:** `credentials/README.md`
