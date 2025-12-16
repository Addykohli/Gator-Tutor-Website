"""
Course Request model representing user requests for more courses to be covered.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from search.database import Base

class CourseRequest(Base):
    __tablename__ = "course_requests"

    course_req_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)

    course_number = Column(String(50), nullable=False, index=True)  
    title = Column(Text, nullable=True)
    notes = Column(String(2000), nullable=True)

    status = Column(Enum("pending", "approved", "rejected", name="coverage_status"), nullable=False, default="pending", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
