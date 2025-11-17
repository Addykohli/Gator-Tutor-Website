from sqlalchemy.orm import Session
from backend.search.models.user import User  # adjust import if different location

def get_user(db: Session, username:str, password:str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username:str, password:str):
    user = get_user(db, username)
    if not user:
        return False
    if user.password != password:
        return None
    return user
