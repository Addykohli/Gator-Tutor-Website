"""
Pydantic schemas for booking-related operations.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class BookingBase(BaseModel):
    """Base schema for booking data."""
    start_time: datetime
    end_time: datetime
    course_id: int = Field(..., description="Course ID (required)")
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


class BookingStatusUpdate(BaseModel):
    """Schema for updating booking status."""
    status: str = Field(..., description="New status: pending, confirmed, cancelled, or completed")
    tutor_id: int = Field(..., description="Tutor ID for authorization")
