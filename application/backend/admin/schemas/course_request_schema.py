"""
Pydantic schemas for course request responses.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CourseRequestCreate(BaseModel):
    course_number: str
    title: str | None = None
    notes: str | None = None
    email: str

class CourseRequestResponse(BaseModel):
    course_req_id: int
    user_id: int
    course_number: str
    title: Optional[str]
    notes: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class CourseUpdate(BaseModel):
    status: str

