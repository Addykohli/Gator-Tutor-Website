"""
Booking model for tutor sessions.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from search.database import Base


class Booking(Base):
    """
    Booking model representing a scheduled session between a student and a tutor.
    """
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, nullable=False, index=True)
    student_id = Column(Integer, nullable=False, index=True)
    
    # Specific date and time for the session
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    # Additional fields
    course_id = Column(Integer, ForeignKey("courses.course_id"), nullable=True)
    meeting_link = Column(String(500), nullable=True)
    
    # Status: pending, confirmed, cancelled, completed
    status = Column(Enum("pending", "confirmed", "cancelled", "completed", name="booking_status"), default="pending", nullable=False)
    
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    tutor_profile = relationship("TutorProfile", backref="bookings", primaryjoin="Booking.tutor_id == TutorProfile.tutor_id", foreign_keys=[tutor_id])
    student = relationship("User", backref="student_bookings", primaryjoin="Booking.student_id == User.user_id", foreign_keys=[student_id])
    course = relationship("Course")

    def __repr__(self):
        return f"<Booking(id={self.booking_id}, tutor={self.tutor_id}, student={self.student_id}, time={self.start_time})>"
