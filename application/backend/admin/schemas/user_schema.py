from pydantic import BaseModel
from typing import Optional

class DropUserRequest(BaseModel):
    user_id: int
    role: Optional[str] = None  # Optional role verification (tutor, student, admin, both)

class DropUserResponse(BaseModel):
    message: str
    deleted_user_id: int
    deleted_email: str
    deleted_name: str
    deleted_role: str
    related_records_deleted: dict

