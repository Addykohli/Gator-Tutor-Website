"""
Pydantic schemas for course responses.
"""
from pydantic import BaseModel
from datetime import datetime

class CourseCreate(BaseModel):
    department_code: str
    course_number: str
    title: str

class CourseResponse(BaseModel):
    course_id:int
    department_code: str
    course_number: str
    title: str
    is_active:bool

class CourseUpdate(BaseModel):
    department_code: str | None=None
    course_number: str | None=None
    title: str | None=None
    is_active:bool  | None=None