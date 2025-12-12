"""
Pydantic schemas for course request responses.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class CourseRequestCreate(BaseModel):
    courseNumber: str
    title: Optional[str] = None
    notes: Optional[str] = None
    email: EmailStr

class CourseRequestOut(BaseModel):
    id: int
    course_number: str
    title: Optional[str] = None
    notes: Optional[str] = None
    email: EmailStr
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class CourseRequestStatusUpdate(BaseModel):
    status: str 
