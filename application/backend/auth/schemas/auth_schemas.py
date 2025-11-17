"""
pydantic model for form/login responses
"""
from pydantic import BaseModel, EmailStr


class UserIn(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str
    user_id: int