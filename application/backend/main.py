from fastapi import FastAPI
from fastapi.responses import JSONResponse, RedirectResponse

app = FastAPI(title="Team08 API", version="0.1.0")

@app.get("/")
def root():
    return {"service": "team08-api", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/team")
def team():
    return {"team": "08", "milestone": "M0", "backend": "fastapi"}
