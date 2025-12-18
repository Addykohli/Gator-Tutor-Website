# Team08 Backend — FastAPI + uv

Minimal backend for CSC 648/848. Uses [FastAPI] with [uv] (package manager).

## Requirements
- Python 3.10+ installed
- uv installed (`pip install uv` or see uv docs)
- This folder contains:
  - `main.py` — app entrypoint
  - `requirements.txt` — deps:
    ```
    fastapi
    uvicorn[standard]
    ```

## Quickstart (local dev, with uv)
```bash
cd application/backend

# Create and activate a venv with uv
uv venv .venv
source .venv/bin/activate

# Install deps using uv
uv pip install -r requirements.txt

# Run the app
uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000

#tunnel to db
./run/start-db-tunnel.ps1 ubuntu