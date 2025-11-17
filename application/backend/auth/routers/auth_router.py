# backend/auth/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.search.database import get_db   # adjust import path if needed
from backend.auth.schemas.auth_schemas import UserIn, TokenResponse
from backend.auth.services.auth_service import authenticate_user, get_user
from backend.auth.password_utils import validate_sfsu_email, make_simple_token

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(req: UserIn, db: Session = Depends(get_db)):
    #require sfsu email instead of username for login
    if not validate_sfsu_email(req.username):
        return {"message": "Not a valid @sfsu.edu email."}

    auth_result = authenticate_user(db, req.username, req.password)
    #incorrect password
    if auth_result is None:
        raise HTTPException(status_code=401, detail={"message": "Invalid username or password"})

    #correct existing user and password
    user = auth_result
    token = make_simple_token(user.user_id if hasattr(user, "user_id") else user.id)
    return {"token": token, "user_id": user.user_id if hasattr(user, "user_id") else user.id}