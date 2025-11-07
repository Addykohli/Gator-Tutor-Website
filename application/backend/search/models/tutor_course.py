"""
TutorCourse junction table for many-to-many relationship between tutors and courses.
"""
from sqlalchemy import Column, Integer, ForeignKey, Index
from ..database import Base


class TutorCourse(Base):
    """
    TutorCourse junction table linking tutors to courses.
    
    Attributes:
        tutor_id: Foreign key to tutor_profiles.tutor_id
        course_id: Foreign key to courses.course_id
    """
    __tablename__ = "tutor_courses"

    tutor_id = Column(Integer, ForeignKey("tutor_profiles.tutor_id"), primary_key=True, nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.course_id"), primary_key=True, nullable=False, index=True)

    # Composite index for efficient filtering
    __table_args__ = (
        Index('idx_tutor_course', 'tutor_id', 'course_id'),
    )

    def __repr__(self):
        return f"<TutorCourse(tutor_id={self.tutor_id}, course_id={self.course_id})>"

