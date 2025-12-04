"""
Pydantic schemas for availability-related operations.
"""
from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import List, Optional, Literal


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


class AvailabilityRangeResponse(BaseModel):
    """Schema for availability range response."""
    tutor_id: int
    start_date: date
    end_date: date
    available_dates: List[date]


class AvailabilitySlotCreate(BaseModel):
    """Schema for creating a new availability slot."""
    weekday: int = Field(..., ge=0, le=6, description="Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday")
    start_time: time = Field(..., description="Start time of availability (HH:MM:SS)")
    end_time: time = Field(..., description="End time of availability (HH:MM:SS)")
    location_mode: str = Field("online", max_length=50, description="Location mode: online, campus, etc. Defaults to 'online'")
    location_note: Optional[str] = Field(None, max_length=500, description="Additional location notes")
    valid_from: Optional[date] = Field(None, description="Start date for availability (defaults to today)")
    valid_until: Optional[date] = Field(None, description="Custom end date (overrides duration if provided)")
    duration: Optional[Literal["week", "month", "semester", "forever"]] = Field(
        "semester",
        description="Duration: week=7d, month=28d, semester=112d, forever=no expiry. Ignored if valid_until is set."
    )


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
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None

    class Config:
        from_attributes = True

