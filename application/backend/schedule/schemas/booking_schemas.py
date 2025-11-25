"""
Pydantic schemas for booking-related operations.
"""
from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import List, Optional


class BookingBase(BaseModel):
    """Base schema for booking data."""
    start_time: datetime
    end_time: datetime
    course_id: Optional[int] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    """Schema for creating a new booking."""
    tutor_id: int
    student_id: int  # In a real app, this would come from the authenticated user


class BookingResponse(BookingBase):
    """Schema for booking response."""
    booking_id: int
    tutor_id: int
    student_id: int
    status: str
    created_at: datetime
    course_id: Optional[int] = None
    meeting_link: Optional[str] = None
    
    # Nested details for display
    tutor_name: Optional[str] = None
    student_name: Optional[str] = None
    course_title: Optional[str] = None

    class Config:
        from_attributes = True


class TimeSlot(BaseModel):
    """Schema for an available time slot."""
    start_time: datetime
    end_time: datetime
    is_available: bool = True


class AvailabilityResponse(BaseModel):
    """Schema for availability response."""
    tutor_id: int
    date: date
    slots: List[TimeSlot]


class BookingStatusUpdate(BaseModel):
    """Schema for updating booking status."""
    status: str = Field(..., description="New status: pending, confirmed, cancelled, or completed")
    tutor_id: int = Field(..., description="Tutor ID for authorization")


# Availability Slot Schemas

class AvailabilitySlotCreate(BaseModel):
    """Schema for creating a new availability slot."""
    weekday: int = Field(..., ge=0, le=6, description="Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday")
    start_time: time = Field(..., description="Start time of availability (HH:MM:SS)")
    end_time: time = Field(..., description="End time of availability (HH:MM:SS)")
    location_mode: Optional[str] = Field(None, max_length=50, description="Location mode: online, campus, etc.")
    location_note: Optional[str] = Field(None, max_length=500, description="Additional location notes")


class AvailabilitySlotUpdate(BaseModel):
    """Schema for updating an availability slot. All fields are optional."""
    weekday: Optional[int] = Field(None, ge=0, le=6, description="Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday")
    start_time: Optional[time] = Field(None, description="Start time of availability (HH:MM:SS)")
    end_time: Optional[time] = Field(None, description="End time of availability (HH:MM:SS)")
    location_mode: Optional[str] = Field(None, max_length=50, description="Location mode: online, campus, etc.")
    location_note: Optional[str] = Field(None, max_length=500, description="Additional location notes")


class AvailabilitySlotResponse(BaseModel):
    """Schema for availability slot response."""
    slot_id: int
    tutor_id: int
    weekday: int = Field(..., description="Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday")
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location_mode: Optional[str] = None
    location_note: Optional[str] = None

    class Config:
        from_attributes = True
