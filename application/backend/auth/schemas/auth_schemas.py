"""
pydantic model for form/login responses
"""
from pydantic import BaseModel, EmailStr

# wip: change to email instead of username since no username in db
class UserIn(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    token: str
    user_id: int