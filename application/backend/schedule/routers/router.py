"""
Schedule router for booking and availability management endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from search.database import get_db
from schedule.services.booking_service import (
    create_booking,
    get_student_bookings,
    get_tutor_bookings,
    get_bookings,
    update_booking_status
)
from schedule.services.availability_service import (
    get_tutor_availability,
    get_availability_slots,
    create_availability_slot,
    update_availability_slot,
    delete_availability_slot
)
from schedule.schemas.booking_schemas import (
    BookingCreate,
    BookingResponse,
    BookingStatusUpdate
)
from schedule.schemas.availability_schemas import (
    AvailabilityResponse,
    TimeSlot,
    AvailabilitySlotCreate,
    AvailabilitySlotUpdate,
    AvailabilitySlotResponse
)


router = APIRouter(prefix="/schedule", tags=["schedule"])


# ============================================================================
# Availability Check Endpoints (for students viewing tutor availability)
# ============================================================================

@router.get("/tutors/{tutor_id}/availability", response_model=AvailabilityResponse)
def get_availability_endpoint(
    tutor_id: int,
    date: date = Query(..., description="Date to check availability for (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get available time slots for a tutor on a specific date.
    
    This endpoint calculates available 1-hour slots based on the tutor's
    recurring weekly availability minus any existing bookings.
    """
    try:
        slots = get_tutor_availability(db, tutor_id, date)
        return AvailabilityResponse(
            tutor_id=tutor_id,
            date=date,
            slots=slots
        )
    except Exception as e:
        print(f"Availability error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ============================================================================
# Booking Endpoints
# ============================================================================

@router.post("/bookings", response_model=BookingResponse)
def create_booking_endpoint(
    booking: BookingCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new booking.
    
    Creates a booking request with status "pending" that requires tutor approval.
    The time slot becomes unavailable immediately to prevent double-booking.
    """
    try:
        new_booking = create_booking(db, booking)
        return new_booking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Booking error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/bookings/student/{student_id}", response_model=List[BookingResponse])
def get_student_bookings_endpoint(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all bookings for a student.
    """
    try:
        return get_student_bookings(db, student_id)
    except Exception as e:
        print(f"Get student bookings error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/bookings/tutor/{tutor_id}", response_model=List[BookingResponse])
def get_tutor_bookings_endpoint(
    tutor_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all bookings for a tutor.
    """
    try:
        return get_tutor_bookings(db, tutor_id)
    except Exception as e:
        print(f"Get tutor bookings error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/bookings", response_model=List[BookingResponse])
def search_bookings_endpoint(
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    tutor_id: Optional[int] = Query(None, description="Filter by tutor ID"),
    status: Optional[str] = Query(None, description="Filter by status (pending, confirmed, cancelled, completed)"),
    db: Session = Depends(get_db)
):
    """
    Search bookings by student_id, tutor_id, and/or status.
    
    Use this endpoint to:
    - Get all bookings for a student: ?student_id=X
    - Get all bookings for a tutor: ?tutor_id=X
    - Get pending requests for a tutor: ?tutor_id=X&status=pending
    """
    try:
        return get_bookings(db, student_id, tutor_id, status)
    except Exception as e:
        print(f"Search bookings error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/bookings/{booking_id}/status", response_model=BookingResponse)
def update_booking_status_endpoint(
    booking_id: int,
    status_update: BookingStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update the status of a booking (approve/reject).
    
    - **booking_id**: ID of the booking to update
    - **status**: New status (pending, confirmed, cancelled, completed)
    - **tutor_id**: Tutor ID for authorization (must match the booking's tutor_id)
    
    Only the tutor associated with the booking can update its status.
    """
    try:
        updated_booking = update_booking_status(
            db, 
            booking_id, 
            status_update.status, 
            status_update.tutor_id
        )
        
        # Populate nested details for response
        if updated_booking.tutor_profile and updated_booking.tutor_profile.user:
            updated_booking.tutor_name = f"{updated_booking.tutor_profile.user.first_name} {updated_booking.tutor_profile.user.last_name}"
        if updated_booking.student:
            updated_booking.student_name = f"{updated_booking.student.first_name} {updated_booking.student.last_name}"
        if updated_booking.course:
            updated_booking.course_title = updated_booking.course.title
        
        return updated_booking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Update booking status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ============================================================================
# Availability Slot Management Endpoints (for tutors managing their schedule)
# ============================================================================

@router.get("/tutors/{tutor_id}/availability-slots", response_model=List[AvailabilitySlotResponse])
def get_availability_slots_endpoint(
    tutor_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all recurring availability slots for a tutor.
    
    Returns the tutor's weekly availability schedule, ordered by weekday and start time.
    """
    try:
        slots = get_availability_slots(db, tutor_id)
        return slots
    except Exception as e:
        print(f"Get availability slots error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/tutors/{tutor_id}/availability-slots", response_model=AvailabilitySlotResponse)
def create_availability_slot_endpoint(
    tutor_id: int,
    slot_data: AvailabilitySlotCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new recurring availability slot for a tutor.
    
    - **weekday**: Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    - **start_time**: Start time (HH:MM:SS format)
    - **end_time**: End time (HH:MM:SS format)
    - **location_mode**: Optional (online, campus, etc.)
    - **location_note**: Optional additional notes
    
    Returns 400 if the slot overlaps with an existing slot on the same weekday.
    """
    try:
        new_slot = create_availability_slot(db, tutor_id, slot_data)
        return new_slot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Create availability slot error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/tutors/{tutor_id}/availability-slots/{slot_id}", response_model=AvailabilitySlotResponse)
def update_availability_slot_endpoint(
    tutor_id: int,
    slot_id: int,
    slot_data: AvailabilitySlotUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing availability slot.
    
    - **tutor_id**: Tutor ID for authorization (must own the slot)
    - **slot_id**: ID of the slot to update
    
    All fields in the request body are optional - only provided fields will be updated.
    Returns 400 if:
    - Slot not found
    - Tutor doesn't own the slot
    - Update would create an overlap with another slot
    """
    try:
        updated_slot = update_availability_slot(db, slot_id, tutor_id, slot_data)
        return updated_slot
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Update availability slot error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/tutors/{tutor_id}/availability-slots/{slot_id}")
def delete_availability_slot_endpoint(
    tutor_id: int,
    slot_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete an availability slot.
    
    - **tutor_id**: Tutor ID for authorization (must own the slot)
    - **slot_id**: ID of the slot to delete
    
    Returns 400 if slot not found or tutor doesn't own the slot.
    """
    try:
        delete_availability_slot(db, slot_id, tutor_id)
        return {"message": "Availability slot deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Delete availability slot error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

