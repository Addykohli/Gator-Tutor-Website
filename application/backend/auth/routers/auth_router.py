from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from search.database import get_db
from auth.schemas.auth_schemas import UserIn, TokenResponse
from auth.services.auth_service import authenticate_user, get_user, get_user_by_id
from auth.password_utils import validate_sfsu_email, make_simple_token

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(req: UserIn, db: Session = Depends(get_db)):
    if not validate_sfsu_email(req.email):
        return {"message": "Not a valid @sfsu.edu email."}

    auth_result = authenticate_user(db, req.email, req.password)
    if auth_result is None:
        raise HTTPException(status_code=401, detail={"message": "Invalid email or password"})

    user = auth_result
    token = make_simple_token(user.user_id)
    return {
        "token": token, 
        "user_id": user.user_id}

@router.get("/users/{user_id}")
def get_user_by_id_route(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    return {
        "user_id": user.user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "sfsu_email": user.sfsu_email,
        "role": user.role
    }

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    from search.models.user import User
    users = db.query(User).all()
    return [
        {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "sfsu_email": user.sfsu_email,
            "role": user.role
        }
        for user in users
    ]