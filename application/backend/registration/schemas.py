from pydantic import BaseModel, EmailStr, Field


class RegistrationRequest(BaseModel):
    first_name: str = Field(...)
    last_name: str = Field(...)
    email: EmailStr
    password: str = Field(...)


class RegistrationResponse(BaseModel):
    user_id: int
    email: str
    message: str
