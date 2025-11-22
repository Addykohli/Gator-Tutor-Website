from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from search.database import get_db
from auth.schemas.auth_schemas import UserIn, TokenResponse
from auth.services.auth_service import authenticate_user, get_user
from auth.password_utils import validate_sfsu_email, make_simple_token

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
def login(req: UserIn, db: Session = Depends(get_db)):
    #TBD may only be necessary for Register-require sfsu email instead of username for login
    if not validate_sfsu_email(req.email):
        return {"message": "Not a valid @sfsu.edu email."}

    auth_result = authenticate_user(db, req.email, req.password)
    #incorrect password
    if auth_result is None:
        raise HTTPException(status_code=401, detail={"message": "Invalid email or password"})

    #correct existing user and password
    user = auth_result
    token = make_simple_token(user.user_id)
    return {
        "token": token, 
        "user_id": user.user_id}