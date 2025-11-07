"""
Course model representing courses that tutors can teach.
"""
from sqlalchemy import Column, Integer, String, Boolean, Index
from sqlalchemy.orm import relationship
from ..database import Base


class Course(Base):
    """
    Course model representing courses in the system.
    
    Attributes:
        course_id: Primary key
        department_code: Department code (e.g., "CSC", "MATH")
        course_number: Course number (e.g., "210", "415")
        title: Course title (e.g., "Introduction to Programming in Python")
        is_active: Whether the course is currently active
    """
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, index=True)
    department_code = Column(String(10), nullable=False, index=True)
    course_number = Column(String(10), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    tutors = relationship("TutorProfile", secondary="tutor_courses", back_populates="courses")

    # Composite index for efficient search on department + course_number + title
    __table_args__ = (
        Index('idx_course_search', 'department_code', 'course_number', 'title'),
    )

    def __repr__(self):
        return f"<Course(course_id={self.course_id}, {self.department_code} {self.course_number}: {self.title})>"

