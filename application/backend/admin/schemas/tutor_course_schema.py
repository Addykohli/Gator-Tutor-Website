"""
Pydantic schemas for tutor course request responses.
"""
from pydantic import BaseModel
from datetime import datetime

class TutorCourseRequestCreate(BaseModel):
    course_id:int

class TutorCourseRequestResponse(BaseModel):
    request_id: int
    tutor_id: int
    course_id: int
    status: str
    created_at: datetime
