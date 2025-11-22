"""
Search router for tutor and course search endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..services import (
    search_tutors, 
    search_courses, 
    get_tutor_by_id,
    get_tutor_availability,
    create_booking,
    get_student_bookings,
    get_tutor_bookings,
    get_bookings
)
from ..schemas import (
    TutorSearchResponse,
    TutorSearchResult,
    CourseSearchResponse,
    CourseSearchResult,
    SearchAllResponse,
    TutorSearchResponse,
    TutorSearchResult,
    CourseSearchResponse,
    CourseSearchResult,
    SearchAllResponse,
    TutorDetailResponse
)
from schedule.schemas.booking_schemas import (
    BookingCreate,
    BookingResponse,
    AvailabilityResponse,
    TimeSlot
)
from datetime import date


router = APIRouter(prefix="/search", tags=["search"])


@router.get("/tutors", response_model=TutorSearchResponse)
def search_tutors_endpoint(
    q: Optional[str] = Query(None, max_length=100, description="Search query for tutor names (first name, last name, or full name)"),
    tutor_name: Optional[str] = Query(None, max_length=100, description="Search query specifically for tutor names"),
    department: Optional[str] = Query(None, max_length=10, description="Filter tutors by department code of courses they teach (e.g., 'CSC')"),
    course_number: Optional[str] = Query(None, max_length=10, description="Filter tutors by course number of courses they teach (e.g., '210')"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Search for tutors by name.
    
    - **q**: General search query that searches tutor names (first name, last name, or full name).
             If empty or whitespace, returns all approved tutors (paginated).
    - **tutor_name**: Search query specifically for tutor names
    - **department**: Filter tutors by department code of courses they teach
    - **course_number**: Filter tutors by course number of courses they teach
    
    Note: Empty or whitespace `q` parameter returns all approved tutors with default sorting and pagination.
    """
    try:
        # Normalize q: treat empty/whitespace as None (no filter, returns all results)
        q_norm = (q or "").strip()
        q_norm = q_norm if q_norm else None
        
        # Normalize tutor_name: treat empty/whitespace as None
        tutor_name_norm = (tutor_name or "").strip()
        tutor_name_norm = tutor_name_norm if tutor_name_norm else None
        
        params = {
            "q": q_norm,
            "tutor_name": tutor_name_norm,
            "department": department.upper() if department else None,
            "course_number": course_number,
            "limit": limit,
            "offset": offset
        }
        
        results_dict, total = search_tutors(db, params)
        
        # Convert dicts to Pydantic models
        results = [TutorSearchResult(**r) for r in results_dict]
        
        return TutorSearchResponse(
            items=results,
            total=total,
            limit=limit,
            offset=offset
        )
    
    except Exception as e:
        print(f"Tutor search error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/courses", response_model=CourseSearchResponse)
def search_courses_endpoint(
    q: Optional[str] = Query(None, max_length=100, description="Search query for course title, department code, or course number"),
    department: Optional[str] = Query(None, max_length=10, description="Filter by department code (e.g., 'CSC')"),
    course_number: Optional[str] = Query(None, max_length=10, description="Filter by course number (e.g., '210')"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Search for courses by title, department, or course number.
    
    - **q**: Search query for course title, department code, or course number.
             If empty or whitespace, returns all active courses (paginated).
    
    Returns courses with the count of approved tutors teaching each course.
    """
    try:
        # Normalize q: treat empty/whitespace as None (no filter)
        q_norm = (q or "").strip()
        q_norm = q_norm if q_norm else None
        
        params = {
            "q": q_norm,
            "department": department.upper() if department else None,
            "course_number": course_number,
            "limit": limit,
            "offset": offset
        }
        
        results_dict, total = search_courses(db, params)
        
        # Convert dicts to Pydantic models
        results = [CourseSearchResult(**r) for r in results_dict]
        
        return CourseSearchResponse(
            items=results,
            total=total,
            limit=limit,
            offset=offset
        )
    
    except Exception as e:
        print(f"Course search error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tutors/{tutor_id}", response_model=TutorDetailResponse)
def get_tutor_detail(
    tutor_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information for a specific tutor by ID.
    
    - **tutor_id**: The ID of the tutor to fetch
    
    Returns 404 if tutor not found or not approved.
    """
    try:
        tutor_data = get_tutor_by_id(db, tutor_id)
        
        if not tutor_data:
            raise HTTPException(
                status_code=404,
                detail=f"Tutor with ID {tutor_id} not found or not approved"
            )
        
        return TutorDetailResponse(**tutor_data)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get tutor detail error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/all", response_model=SearchAllResponse)
def search_all_endpoint(
    q: Optional[str] = Query(None, max_length=100, description="Search query for both tutors (names) and courses (titles/codes)"),
    limit: int = Query(20, ge=1, le=50, description="Total limit - will be split between tutors and courses"),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Search for both tutors and courses in a single request.
    
    - **q**: Search query for both tutors (names) and courses (titles/codes).
             If empty or whitespace, returns all approved tutors and active courses (paginated).
    
    Returns aggregated results with both tutors and courses matching the query.
    The limit is split between tutors and courses (limit/2 each, minimum 1).
    
    NOTE: This endpoint executes both searches sequentially. For better performance
    at scale, consider parallelizing with asyncio.gather() when moving to async endpoints.
    
    Pagination metadata (tutor_total, course_total) reflects the full result set,
    not just the returned items within the limit.
    """
    try:
        # Normalize q: treat empty/whitespace as None (no filter)
        q_norm = (q or "").strip()
        q_norm = q_norm if q_norm else None
        
        # Split limit between tutors and courses (min 1 each)
        # NOTE: Sequential execution - fine for now, but consider async parallelization later
        tutor_limit = max(1, limit // 2)
        course_limit = max(1, limit - tutor_limit)
        
        # Prepare params for both searches
        tutor_params = {
            "q": q_norm,
            "tutor_name": None,
            "department": None,
            "course_number": None,
            "limit": tutor_limit,
            "offset": offset
        }
        
        course_params = {
            "q": q_norm,
            "department": None,
            "course_number": None,
            "limit": course_limit,
            "offset": offset
        }
        
        # Execute both searches
        tutors_dict, tutor_total = search_tutors(db, tutor_params)
        courses_dict, course_total = search_courses(db, course_params)
        
        # Convert to Pydantic models
        tutors = [TutorSearchResult(**r) for r in tutors_dict]
        courses = [CourseSearchResult(**r) for r in courses_dict]
        
        return SearchAllResponse(
            tutors=tutors,
            courses=courses,
            tutor_total=tutor_total,
            course_total=course_total,
            limit=limit,
            offset=offset
        )
    
    except Exception as e:
        print(f"Search all error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/tutors/{tutor_id}/availability", response_model=AvailabilityResponse)
def get_availability_endpoint(
    tutor_id: int,
    date: date = Query(..., description="Date to check availability for (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get available time slots for a tutor on a specific date.
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


@router.post("/bookings", response_model=BookingResponse)
def create_booking_endpoint(
    booking: BookingCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new booking.
    """
    try:
        new_booking = create_booking(db, booking)
        return new_booking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Booking error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/bookings/student/{student_id}", response_model=list[BookingResponse])
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


@router.get("/bookings/tutor/{tutor_id}", response_model=list[BookingResponse])
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


@router.get("/bookings", response_model=list[BookingResponse])
def search_bookings_endpoint(
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    tutor_id: Optional[int] = Query(None, description="Filter by tutor ID"),
    db: Session = Depends(get_db)
):
    """
    Search bookings by student_id or tutor_id.
    """
    try:
        return get_bookings(db, student_id, tutor_id)
    except Exception as e:
        print(f"Search bookings error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
