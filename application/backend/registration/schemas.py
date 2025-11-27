from pydantic import BaseModel, EmailStr, Field


class RegistrationRequest(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=1)


class RegistrationResponse(BaseModel):
    user_id: int
    email: str
    message: str
