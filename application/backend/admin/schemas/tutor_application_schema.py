"""
Pydantic schemas for tutor application requests & responses.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum as PyEnum

class ApplicationStatus(str, PyEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class TutorApplicationCreate(BaseModel):
    user_id: int
    full_name: str
    email: str
    gpa: float
    courses: str
    bio: str

class TutorApplicationUpdateStatus(BaseModel):
    status: ApplicationStatus

class TutorApplicationResponse(BaseModel):
    application_id: int
    user_id: int
    full_name: str
    email: str
    gpa: float
    courses: str | None = None
    bio: str | None = None
    status: ApplicationStatus
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
