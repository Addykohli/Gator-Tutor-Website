"""
TutorProfile model representing tutor profiles and information.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import List
from ..database import Base


class TutorProfile(Base):
    """
    TutorProfile model representing tutor profiles.
    
    Attributes:
        tutor_id: Primary key, foreign key to users.user_id
        bio: Tutor biography/description
        hourly_rate_cents: Hourly rate in cents (e.g., 2500 = $25.00)
        languages: Comma-separated string of languages (e.g., "English, Korean")
        status: Profile status (approved, pending, rejected)
        profile_image_path_full: Path to full-size profile image
        profile_image_path_thumb: Path to thumbnail profile image
        last_active_at: Timestamp when tutor was last active
    """
    __tablename__ = "tutor_profiles"

    tutor_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True, index=True)
    bio = Column(String(1000), nullable=True)
    hourly_rate_cents = Column(Integer, nullable=False, default=0, index=True)
    languages = Column(String(255), nullable=True)  # Comma-separated: "English, Korean"
    status = Column(Enum("approved", "pending", "rejected", name="tutor_status"), nullable=False, default="pending", index=True)
    profile_image_path_full = Column(String(500), nullable=True)
    profile_image_path_thumb = Column(String(500), nullable=True)
    last_active_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="tutor_profile")
    courses = relationship("Course", secondary="tutor_courses", back_populates="tutors")
    availability_slots = relationship("AvailabilitySlot", back_populates="tutor_profile", cascade="all, delete-orphan")

    def get_languages(self) -> List[str]:
        """
        Parse comma-separated languages string into a list.
        
        Returns:
            List of language strings, trimmed and filtered for empty strings.
        """
        if not self.languages:
            return []
        return [lang.strip() for lang in self.languages.split(",") if lang.strip()]

    def has_language(self, language: str) -> bool:
        """
        Check if tutor speaks a specific language (case-insensitive).
        
        Args:
            language: Language to check for (e.g., "English", "english")
            
        Returns:
            True if tutor speaks the language, False otherwise.
        """
        if not self.languages:
            return False
        languages_list = self.get_languages()
        return any(lang.lower() == language.lower() for lang in languages_list)

    def __repr__(self):
        return f"<TutorProfile(tutor_id={self.tutor_id}, status={self.status}, rate_cents={self.hourly_rate_cents})>"

