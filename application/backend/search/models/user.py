"""
User model representing users in the system.
"""
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class User(Base):
    """
    User model representing users (students, tutors, admins).
    
    Attributes:
        user_id: Primary key
        sfsu_email: SFSU email address (unique)
        first_name: User's first name
        last_name: User's last name
        role: User role (tutor, student, admin)
        password_hash: Hashed password (not used in search, but part of schema)
        created_at: Timestamp when user was created
        updated_at: Timestamp when user was last updated
    """
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    sfsu_email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum("tutor", "student", "admin", name="user_role"), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tutor_profile = relationship("TutorProfile", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User(user_id={self.user_id}, email={self.sfsu_email}, name={self.first_name} {self.last_name})>"

