"""
Tutor Application model representing student applications to become tutors.
"""
from sqlalchemy import Column, Integer, String,Text, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, foreign
from search.database import Base
from datetime import datetime
from search.models.user import User 

class TutorApplication(Base):
    __tablename__ = "tutor_applications"

    application_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    gpa = Column(Float, nullable=False)
    courses = Column(Text, nullable =True)
    bio = Column(Text, nullable =True)
    status = Column(Enum("pending", "approved", "rejected", name="tutor_application_status"), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", lazy="joined", primaryjoin=foreign(user_id) == User.user_id)
