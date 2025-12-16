from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from auth.routers.auth_router import router as auth_router
from search.routers.router import router as search_router
from schedule.routers.router import router as schedule_router
from admin.routers.admin_router import router as admin_router
from registration.router import router as registration_router
from chat.routers.chat_router import router as chat_router
from tutors.router import router as tutors_router
from ai.router import router as ai_router


app = FastAPI(title="Team08 API", version="0.1.0")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MULTIMEDIA_DIR = os.path.join(BASE_DIR, "multimedia")
app.mount("/static", StaticFiles(directory=MULTIMEDIA_DIR), name="static")
app.mount("/media", StaticFiles(directory=MULTIMEDIA_DIR), name="media")  # Also mount as /media for frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://3.101.155.82",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)
app.include_router(auth_router)
app.include_router(schedule_router)
app.include_router(admin_router)
app.include_router(registration_router)
app.include_router(chat_router)
app.include_router(tutors_router)
app.include_router(ai_router)

@app.get("/")
def root():
    return {"service": "team08-api", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/healthz")
def healthz():
    return "ok"

@app.get("/team")
def team():
    return {"team": "08", "milestone": "M0", "backend": "fastapi"}

@app.get("/api")
def api_root():
    return {"message": "Team08 API", "status": "ok"}