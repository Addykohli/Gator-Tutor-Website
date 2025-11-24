"""
Service functions for booking and availability operations.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from datetime import datetime, date, timedelta, time
from typing import List, Optional, Dict, Any

from ..models.booking import Booking
from ..models.availability_slot import AvailabilitySlot
from search.models import TutorProfile, User
from ..schemas.booking_schemas import BookingCreate, TimeSlot


def get_tutor_availability(db: Session, tutor_id: int, query_date: date) -> List[TimeSlot]:
    """
    Calculate available time slots for a tutor on a specific date.
    
    Args:
        db: Database session
        tutor_id: ID of the tutor
        query_date: Date to check availability for
        
    Returns:
        List of TimeSlot objects representing available slots
    """
    # 1. Get tutor's weekly availability for this day of week
    # weekday(): 0=Monday, 6=Sunday
    # Our DB uses: 0=Sunday, 1=Monday, ..., 6=Saturday (based on typical SQL conventions or previous code)
    # Let's check the AvailabilitySlot model comment: "0=Sunday, 6=Saturday"
    # Python date.weekday(): 0=Monday, 6=Sunday.
    # We need to map Python weekday to DB weekday.
    # Python: Mon(0), Tue(1), Wed(2), Thu(3), Fri(4), Sat(5), Sun(6)
    # DB: Sun(0), Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6)
    
    python_weekday = query_date.weekday()
    db_weekday = (python_weekday + 1) % 7
    
    availability_slots = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.tutor_id == tutor_id,
        AvailabilitySlot.weekday == db_weekday
    ).all()
    
    if not availability_slots:
        return []
        
    # 2. Get existing bookings for this date
    start_of_day = datetime.combine(query_date, time.min)
    end_of_day = datetime.combine(query_date, time.max)
    
    existing_bookings = db.query(Booking).filter(
        Booking.tutor_id == tutor_id,
        Booking.status != 'cancelled',
        Booking.start_time >= start_of_day,
        Booking.end_time <= end_of_day
    ).all()
    
    # 3. Generate available slots
    # For simplicity, we'll generate 1-hour slots within the availability windows
    available_slots = []
    
    for slot in availability_slots:
        if not slot.start_time or not slot.end_time:
            continue
            
        # Convert time to datetime for comparison
        current_time = datetime.combine(query_date, slot.start_time)
        end_time = datetime.combine(query_date, slot.end_time)
        
        # Generate 1-hour slots
        while current_time + timedelta(hours=1) <= end_time:
            slot_start = current_time
            slot_end = current_time + timedelta(hours=1)
            
            # Check if this slot overlaps with any booking
            is_booked = False
            for booking in existing_bookings:
                # Overlap logic: (StartA < EndB) and (EndA > StartB)
                if slot_start < booking.end_time and slot_end > booking.start_time:
                    is_booked = True
                    break
            
            if not is_booked:
                available_slots.append(TimeSlot(
                    start_time=slot_start,
                    end_time=slot_end,
                    is_available=True
                ))
            
            current_time += timedelta(hours=1)
            
    return available_slots


def create_booking(db: Session, booking_data: BookingCreate) -> Booking:
    """
    Create a new booking.
    
    Args:
        db: Database session
        booking_data: Booking creation data
        
    Returns:
        Created Booking object
        
    Raises:
        ValueError: If slot is not available
    """
    # 1. Check if slot is available
    # Check for overlapping bookings
    overlapping = db.query(Booking).filter(
        Booking.tutor_id == booking_data.tutor_id,
        Booking.status != 'cancelled',
        Booking.start_time < booking_data.end_time,
        Booking.end_time > booking_data.start_time
    ).first()
    
    if overlapping:
        raise ValueError("This time slot is already booked.")
        
    # 2. Create booking
    new_booking = Booking(
        tutor_id=booking_data.tutor_id,
        student_id=booking_data.student_id,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        notes=booking_data.notes,
        course_id=booking_data.course_id,
        meeting_link=booking_data.meeting_link,
        status="pending"  # Default to pending, requires tutor approval
    )
    
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    
    return new_booking


def get_student_bookings(db: Session, student_id: int) -> List[Booking]:
    """Get all bookings for a student."""
    return db.query(Booking).options(
        joinedload(Booking.tutor_profile).joinedload(TutorProfile.user),
        joinedload(Booking.course)
    ).filter(
        Booking.student_id == student_id
    ).order_by(Booking.start_time.desc()).all()


def get_tutor_bookings(db: Session, tutor_id: int) -> List[Booking]:
    """Get all bookings for a tutor."""
    return db.query(Booking).options(
        joinedload(Booking.student),
        joinedload(Booking.course)
    ).filter(
        Booking.tutor_id == tutor_id
    ).order_by(Booking.start_time.desc()).all()


def get_bookings(db: Session, student_id: Optional[int] = None, tutor_id: Optional[int] = None, status: Optional[str] = None) -> List[Booking]:
    """
    Get bookings filtered by student_id, tutor_id, and/or status.
    """
    query = db.query(Booking).options(
        joinedload(Booking.tutor_profile).joinedload(TutorProfile.user),
        joinedload(Booking.student),
        joinedload(Booking.course)
    )
    
    if student_id:
        query = query.filter(Booking.student_id == student_id)
    if tutor_id:
        query = query.filter(Booking.tutor_id == tutor_id)
    if status:
        query = query.filter(Booking.status == status)
        
    bookings = query.order_by(Booking.start_time.desc()).all()

    # Populate nested details for response model
    for booking in bookings:
        if booking.tutor_profile and booking.tutor_profile.user:
            booking.tutor_name = f"{booking.tutor_profile.user.first_name} {booking.tutor_profile.user.last_name}"
        if booking.student:
            booking.student_name = f"{booking.student.first_name} {booking.student.last_name}"
        if booking.course:
            booking.course_title = booking.course.title
            
    return bookings


def update_booking_status(db: Session, booking_id: int, new_status: str, tutor_id: int) -> Booking:
    """
    Update the status of a booking.
    
    Args:
        db: Database session
        booking_id: ID of the booking to update
        new_status: New status value (pending, confirmed, cancelled, completed)
        tutor_id: ID of the tutor (for authorization - only tutor can update their bookings)
        
    Returns:
        Updated Booking object with relationships loaded
        
    Raises:
        ValueError: If booking not found, tutor_id doesn't match, or invalid status
    """
    # Valid status values
    valid_statuses = ["pending", "confirmed", "cancelled", "completed"]
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Get the booking with relationships loaded
    booking = db.query(Booking).options(
        joinedload(Booking.tutor_profile).joinedload(TutorProfile.user),
        joinedload(Booking.student),
        joinedload(Booking.course)
    ).filter(Booking.booking_id == booking_id).first()
    
    if not booking:
        raise ValueError(f"Booking with ID {booking_id} not found")
    
    # Validate tutor authorization
    if booking.tutor_id != tutor_id:
        raise ValueError("Only the tutor associated with this booking can update its status")
    
    # Update status
    booking.status = new_status
    db.commit()
    db.refresh(booking)
    
    return booking
