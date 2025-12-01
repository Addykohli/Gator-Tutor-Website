from sqlalchemy.orm import Session
from sqlalchemy import func
from search.models.user import User
from passlib.context import CryptContext
import hashlib
'''
Known User 
email: tim.jim@sfsu.edu
pw: test12
'''
pwd_context = CryptContext(schemes =["argon2"], deprecated="auto")

def get_user(db: Session, email:str):
    return db.query(User).filter(func.lower(User.sfsu_email) == func.lower(email)).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.user_id == user_id).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.user_id == user_id).first()

def authenticate_user(db: Session, email:str, password:str):
    user = get_user(db, email)
    if not user:
        print("no user found for email:", email)
        return None
    print("hash in DB: ", user.password_hash)
    if not pwd_context.verify(password, user.password_hash):
        print("pwd hash verification failed")
        return None
    
    return user
