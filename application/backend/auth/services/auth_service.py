from sqlalchemy.orm import Session
from search.models.user import User
import hashlib
 #need to change to email
def get_user(db: Session, email:str):
    return db.query(User).filter(User.sfsu_email == email).first()

def authenticate_user(db: Session, email:str, password:str):
    user = get_user(db, email)
    if not user:
        return None
    hash_generated = hashlib.sha256(password.encode()).hexdigest()
    if user.password_hash != hash_generated:
        return None
    return user
