"""
Pydantic schemas for tutor course request responses.
"""
from pydantic import BaseModel
from datetime import datetime
class UserInfo(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    
class TutorInfo(BaseModel):
    tutor_id: int
    user: UserInfo

class CourseInfo(BaseModel):
    course_id: int
    department_code: str
    course_number: str
    title: str
class TutorCourseRequestCreate(BaseModel):
    course_id:int

class TutorCourseRequestResponse(BaseModel):
    request_id: int
    tutor_id: int
    status: str
    created_at: datetime
    course: CourseInfo
    tutor: TutorInfo
