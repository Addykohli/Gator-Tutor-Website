"""
Service functions for booking operations.
"""
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from ..models.booking import Booking
from search.models import TutorProfile, User, Course
from ..schemas.booking_schemas import BookingCreate


def create_booking(db: Session, booking_data: BookingCreate) -> Booking:
    """
    Create a new booking.
    
    Args:
        db: Database session
        booking_data: Booking creation data
        
    Returns:
        Created Booking object
        
    Raises:
        ValueError: If slot is not available or course_id is missing
    """
    # Validate that course_id is provided (required field)
    if not booking_data.course_id:
        raise ValueError("Course ID is required to create a booking.")
    
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
    
    # Load the course relationship and populate course_title
    if new_booking.course_id:
        # Reload with course relationship
        booking_with_course = db.query(Booking).options(
            joinedload(Booking.course)
        ).filter(Booking.booking_id == new_booking.booking_id).first()
        
        if booking_with_course and booking_with_course.course:
            booking_with_course.course_title = booking_with_course.course.title
            return booking_with_course
    
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
    bookings = db.query(Booking).options(
        joinedload(Booking.student),
        joinedload(Booking.course)
    ).filter(
        Booking.tutor_id == tutor_id
    ).order_by(Booking.start_time.desc()).all()
    
    # Populate course_title and student details for response
    for booking in bookings:
        if booking.course:
            booking.course_title = booking.course.title
        elif booking.course_id:
            # Course ID exists but relationship didn't load - try to fetch it
            course = db.query(Course).filter(Course.course_id == booking.course_id).first()
            if course:
                booking.course_title = course.title
            else:
                print(f"Warning: Course with ID {booking.course_id} not found for booking {booking.booking_id}")
        else:
            print(f"Warning: Booking {booking.booking_id} has no course_id")
        
        # Populate student_name and student_email
        if booking.student:
            booking.student_name = f"{booking.student.first_name} {booking.student.last_name}"
            booking.student_email = booking.student.sfsu_email
    
    return bookings


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
            booking.student_email = booking.student.sfsu_email
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
