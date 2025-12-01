"""
Service functions for availability operations.
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, date, timedelta, time
from typing import List, Optional

from ..models.booking import Booking
from ..models.availability_slot import AvailabilitySlot
from ..schemas.availability_schemas import TimeSlot, AvailabilitySlotCreate, AvailabilitySlotUpdate


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
        AvailabilitySlot.weekday == db_weekday,
        # Filter by valid_from (NULL or <= query_date)
        or_(AvailabilitySlot.valid_from == None, AvailabilitySlot.valid_from <= query_date),
        # Filter out expired slots (valid_until is NULL or >= query_date)
        or_(AvailabilitySlot.valid_until == None, AvailabilitySlot.valid_until >= query_date)
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


# ============================================================================
# Availability Slot Management Functions
# ============================================================================

def _check_slot_overlap(
    db: Session, 
    tutor_id: int, 
    weekday: int, 
    start_time: time, 
    end_time: time, 
    valid_from: Optional[date] = None,
    valid_until: Optional[date] = None,
    exclude_slot_id: Optional[int] = None
) -> bool:
    """
    Check if a time range overlaps with existing slots on the same weekday.
    
    Now includes date range checking: two slots only overlap if their time ranges
    AND their date ranges intersect.
    
    Args:
        db: Database session
        tutor_id: ID of the tutor
        weekday: Day of week (0=Sunday, 6=Saturday)
        start_time: Start time of the new/updated slot
        end_time: End time of the new/updated slot
        valid_from: Start date of the new slot (None = starts immediately)
        valid_until: End date of the new slot (None = no expiry)
        exclude_slot_id: Optional slot ID to exclude (for updates)
        
    Returns:
        True if there's an overlap, False otherwise
    """
    # Get all slots for this weekday with time overlap
    potential_overlaps = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.tutor_id == tutor_id,
        AvailabilitySlot.weekday == weekday,
        # Time overlap: (start1 < end2) and (end1 > start2)
        AvailabilitySlot.start_time < end_time,
        AvailabilitySlot.end_time > start_time
    )
    
    if exclude_slot_id:
        potential_overlaps = potential_overlaps.filter(AvailabilitySlot.slot_id != exclude_slot_id)
    
    # Check each potential overlap for date range conflicts
    for existing_slot in potential_overlaps:
        # Check if date ranges overlap
        # Two date ranges overlap if: (start1 <= end2 OR end2 is None) AND (end1 >= start2 OR end1 is None)
        
        existing_from = existing_slot.valid_from
        existing_until = existing_slot.valid_until
        
        # Date range overlap logic:
        # If either range is infinite (None), they overlap
        # Otherwise, check: (start1 <= end2) AND (end1 >= start2)
        
        # Check start conditions
        if valid_until is not None and existing_from is not None:
            if valid_until < existing_from:
                # New slot ends before existing starts
                continue
        
        # Check end conditions  
        if valid_from is not None and existing_until is not None:
            if valid_from > existing_until:
                # New slot starts after existing ends
                continue
        
        # If we get here, the date ranges overlap
        return True
    
    return False


def get_availability_slots(db: Session, tutor_id: int) -> List[AvailabilitySlot]:
    """
    Get all availability slots for a tutor (including expired and future slots).
    
    Note: We return ALL slots so the frontend can properly manage and delete them.
    Date filtering should only happen when calculating actual availability,
    not when managing the slot configuration.
    
    Args:
        db: Database session
        tutor_id: ID of the tutor
        
    Returns:
        List of AvailabilitySlot objects ordered by weekday and start_time
    """
    return db.query(AvailabilitySlot).filter(
        AvailabilitySlot.tutor_id == tutor_id
    ).order_by(
        AvailabilitySlot.weekday,
        AvailabilitySlot.start_time
    ).all()


# Duration mapping: duration string -> number of days
DURATION_DAYS = {
    "week": 7,
    "month": 28,
    "semester": 112,
    "forever": None
}


def create_availability_slot(
    db: Session, 
    tutor_id: int, 
    slot_data: AvailabilitySlotCreate
) -> AvailabilitySlot:
    """
    Create a new availability slot for a tutor.
    
    Args:
        db: Database session
        tutor_id: ID of the tutor
        slot_data: Slot creation data
        
    Returns:
        Created AvailabilitySlot object
        
    Raises:
        ValueError: If slot overlaps with existing slot or times are invalid
    """
    # Validate start_time < end_time
    if slot_data.start_time >= slot_data.end_time:
        raise ValueError("Start time must be before end time")
    
    # Calculate valid_from and valid_until first
    valid_from = slot_data.valid_from  # Can be None (starts immediately)
    start_date = valid_from or date.today()  # Use valid_from or default to today
    
    # If custom valid_until is provided, use it; otherwise calculate from duration
    if slot_data.valid_until is not None:
        valid_until = slot_data.valid_until
    else:
        valid_until = None
        duration = slot_data.duration or "semester"  # Default to semester
        if duration != "forever":
            days = DURATION_DAYS.get(duration, 112)  # Default to semester (112 days)
            valid_until = start_date + timedelta(days=days)
    
    # Check for overlapping slots (including date range check)
    if _check_slot_overlap(
        db, tutor_id, slot_data.weekday, 
        slot_data.start_time, slot_data.end_time,
        valid_from, valid_until
    ):
        raise ValueError("This time slot overlaps with an existing availability slot")
    
    # Create the slot
    new_slot = AvailabilitySlot(
        tutor_id=tutor_id,
        weekday=slot_data.weekday,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time,
        location_mode=slot_data.location_mode,
        location_note=slot_data.location_note,
        valid_from=valid_from,
        valid_until=valid_until
    )
    
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    
    return new_slot


def update_availability_slot(
    db: Session, 
    slot_id: int, 
    tutor_id: int, 
    slot_data: AvailabilitySlotUpdate
) -> AvailabilitySlot:
    """
    Update an existing availability slot.
    
    Args:
        db: Database session
        slot_id: ID of the slot to update
        tutor_id: ID of the tutor (for authorization)
        slot_data: Slot update data (partial updates allowed)
        
    Returns:
        Updated AvailabilitySlot object
        
    Raises:
        ValueError: If slot not found, tutor doesn't own slot, or update creates overlap
    """
    # Get the slot
    slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.slot_id == slot_id
    ).first()
    
    if not slot:
        raise ValueError(f"Availability slot with ID {slot_id} not found")
    
    # Verify ownership
    if slot.tutor_id != tutor_id:
        raise ValueError("Only the tutor who owns this slot can update it")
    
    # Determine final values (use new if provided, otherwise keep existing)
    new_weekday = slot_data.weekday if slot_data.weekday is not None else slot.weekday
    new_start_time = slot_data.start_time if slot_data.start_time is not None else slot.start_time
    new_end_time = slot_data.end_time if slot_data.end_time is not None else slot.end_time
    
    # Validate start_time < end_time
    if new_start_time and new_end_time and new_start_time >= new_end_time:
        raise ValueError("Start time must be before end time")
    
    # Check for overlapping slots (excluding this slot, including date ranges)
    if new_start_time and new_end_time:
        if _check_slot_overlap(
            db, tutor_id, new_weekday, 
            new_start_time, new_end_time,
            slot.valid_from, slot.valid_until,  # Use existing date range
            exclude_slot_id=slot_id
        ):
            raise ValueError("This time slot overlaps with an existing availability slot")
    
    # Update fields
    if slot_data.weekday is not None:
        slot.weekday = slot_data.weekday
    if slot_data.start_time is not None:
        slot.start_time = slot_data.start_time
    if slot_data.end_time is not None:
        slot.end_time = slot_data.end_time
    if slot_data.location_mode is not None:
        slot.location_mode = slot_data.location_mode
    if slot_data.location_note is not None:
        slot.location_note = slot_data.location_note
    
    db.commit()
    db.refresh(slot)
    
    return slot


def delete_availability_slot(db: Session, slot_id: int, tutor_id: int) -> bool:
    """
    Delete an availability slot.
    
    Args:
        db: Database session
        slot_id: ID of the slot to delete
        tutor_id: ID of the tutor (for authorization)
        
    Returns:
        True if deleted successfully
        
    Raises:
        ValueError: If slot not found or tutor doesn't own slot
    """
    # Get the slot
    slot = db.query(AvailabilitySlot).filter(
        AvailabilitySlot.slot_id == slot_id
    ).first()
    
    if not slot:
        raise ValueError(f"Availability slot with ID {slot_id} not found")
    
    # Verify ownership
    if slot.tutor_id != tutor_id:
        raise ValueError("Only the tutor who owns this slot can delete it")
    
    db.delete(slot)
    db.commit()
    
    return True

