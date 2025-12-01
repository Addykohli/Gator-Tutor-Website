from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from .schemas import RegistrationRequest, RegistrationResponse

from .service import email_exists, create_user
from search.database import get_db

router = APIRouter(prefix="/api", tags=["registration"])

@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: RegistrationRequest, db: Session = Depends(get_db)):
    if email_exists(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email already registered."
        )

    user = create_user(db, data.first_name, data.last_name, data.email, data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="email already registered."
        )

    return RegistrationResponse(
        user_id=user.user_id,
        email=user.sfsu_email,
        message="registration was successful"
    )
