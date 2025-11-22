"""
AvailabilitySlot model for tutor availability (optional - may not be used in initial search).
"""
from sqlalchemy import Column, Integer, String, Time, ForeignKey, Index
from sqlalchemy.orm import relationship
from search.database import Base


class AvailabilitySlot(Base):
    """
    AvailabilitySlot model representing tutor availability slots.
    
    Note: This is optional for the initial prototype.
    We'll include it in the model but won't use it in initial search.
    
    Attributes:
        slot_id: Primary key
        tutor_id: Foreign key to tutor_profiles.tutor_id
        weekday: Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
        start_time: Start time of availability
        end_time: End time of availability
        location_mode: Location mode (online, campus, etc.)
        location_note: Additional location notes
    """
    __tablename__ = "availability_slots"

    slot_id = Column(Integer, primary_key=True, index=True)
    tutor_id = Column(Integer, ForeignKey("tutor_profiles.tutor_id"), nullable=False, index=True)
    weekday = Column(Integer, nullable=False)  # 0=Sunday, 6=Saturday
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    location_mode = Column(String(50), nullable=True)  # online, campus, etc.
    location_note = Column(String(500), nullable=True)

    # Relationships
    tutor_profile = relationship("TutorProfile", back_populates="availability_slots")

    # Composite index for weekday filtering
    __table_args__ = (
        Index('idx_tutor_weekday', 'tutor_id', 'weekday'),
    )

    def __repr__(self):
        return f"<AvailabilitySlot(slot_id={self.slot_id}, tutor_id={self.tutor_id}, weekday={self.weekday})>"

