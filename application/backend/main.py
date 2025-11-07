from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from search import router as search_router

app = FastAPI(title="Team08 API", version="0.1.0")

# CORS middleware - allow React frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(search_router)

@app.get("/")
def root():
    return {"service": "team08-api", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/team")
def team():
    return {"team": "08", "milestone": "M0", "backend": "fastapi"}
