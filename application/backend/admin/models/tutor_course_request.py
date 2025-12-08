"""
Tutor Course Request model representing tutor courses submited to admin.
"""
from sqlalchemy import Column, Integer, ForeignKey, Text, Enum, DateTime
from sqlalchemy.orm import relationship
from search.database import Base
from datetime import datetime

class TutorCourseRequest(Base):
    __tablename__ ="tutor_course_requests"
    request_id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=False, index=True)

    status = Column(Enum("pending", "approved", "rejected", name="tutor_course_request_status"), default="pending")
    created_at = Column(DateTime, default = datetime.utcnow)