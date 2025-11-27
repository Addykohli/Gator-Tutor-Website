from sqlalchemy.orm import Session
from sqlalchemy import func
from search.models.user import User
from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError

def email_exists(db: Session, email: str) -> bool:
    if not email:
        return False

    existing = db.query(User).filter(func.lower(User.sfsu_email) == func.lower(email)).first()
    return existing is not None


def create_user(db: Session, first_name: str, last_name: str, email: str, password: str):
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    password_hash = pwd_context.hash(password)

    user = User(
        sfsu_email=email,
        first_name=first_name,
        last_name=last_name,
        role="student",
        password_hash=password_hash,
    )

    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return None

    db.refresh(user)
    return user