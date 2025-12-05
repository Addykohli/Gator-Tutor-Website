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
    get_filter_options
)
from ..schemas import (
    TutorSearchResponse,
    TutorSearchResult,
    CourseSearchResponse,
    CourseSearchResult,
    SearchAllResponse,
    TutorDetailResponse,
    FilterOptionsResponse
)
from schedule.schemas.booking_schemas import (
    BookingCreate,
    BookingResponse,
)
from datetime import date, time


router = APIRouter(prefix="/search", tags=["search"])


@router.get("/tutors", response_model=TutorSearchResponse)
def search_tutors_endpoint(
    q: Optional[str] = Query(None, max_length=100, description="Search query for tutor names (first name, last name, or full name)"),
    tutor_name: Optional[str] = Query(None, max_length=100, description="Search query specifically for tutor names"),
    department: Optional[str] = Query(None, max_length=10, description="Filter tutors by department code of courses they teach (e.g., 'CSC')"),
    departments: Optional[str] = Query(None, max_length=100, description="Filter tutors by multiple department codes, comma-separated (e.g., 'CSC,MATH')"),
    course_number: Optional[str] = Query(None, max_length=10, description="Filter tutors by course number of courses they teach (e.g., '210')"),
    course_levels: Optional[str] = Query(None, max_length=50, description="Filter by course levels, comma-separated (e.g., '100,200,300')"),
    min_rate: Optional[int] = Query(None, ge=0, description="Minimum hourly rate in cents (e.g., 2000 = $20.00)"),
    max_rate: Optional[int] = Query(None, ge=0, description="Maximum hourly rate in cents (e.g., 5000 = $50.00)"),
    languages: Optional[str] = Query(None, max_length=200, description="Languages, comma-separated (e.g., 'English,Spanish')"),
    sort_by: Optional[str] = Query("price", regex="^(price|name)$", description="Sort field - 'price' or 'name'"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$", description="Sort order - 'asc' or 'desc'"),
    weekday: Optional[int] = Query(None, ge=0, le=6, description="Filter by weekday (0=Sunday, 6=Saturday)"),
    available_after: Optional[time] = Query(None, description="Filter tutors available after this time (HH:MM:SS)"),
    available_before: Optional[time] = Query(None, description="Filter tutors available before this time (HH:MM:SS)"),
    location_modes: Optional[str] = Query(None, max_length=100, description="Location modes, comma-separated (e.g., 'online,campus')"),
    has_availability: Optional[bool] = Query(None, description="Filter tutors that have availability slots"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Search for tutors with advanced filtering options.
    
    - **q**: General search query that searches tutor names (first name, last name, or full name).
             If empty or whitespace, returns all approved tutors (paginated).
    - **tutor_name**: Search query specifically for tutor names
    - **department**: Filter tutors by single department code of courses they teach
    - **departments**: Filter tutors by multiple department codes, comma-separated
    - **course_number**: Filter tutors by course number of courses they teach
    - **course_levels**: Filter by course levels, comma-separated (e.g., '100,200' matches courses starting with those digits)
    - **min_rate**: Minimum hourly rate in cents
    - **max_rate**: Maximum hourly rate in cents
    - **languages**: Languages, comma-separated (tutors who speak ANY of the selected languages)
    - **sort_by**: Sort field - 'price' or 'name' (default: 'price')
    - **sort_order**: Sort order - 'asc' or 'desc' (default: 'asc')
    - **weekday**: Filter by weekday (0=Sunday, 6=Saturday)
    - **available_after**: Filter tutors available after this time
    - **available_before**: Filter tutors available before this time
    - **location_modes**: Location modes, comma-separated (e.g., 'online,campus')
    - **has_availability**: Filter tutors that have availability slots
    
    Note: Empty or whitespace `q` parameter returns all approved tutors with default sorting and pagination.
    All filters can be combined for advanced search.
    """
    try:
        # Normalize q: treat empty/whitespace as None (no filter, returns all results)
        q_norm = (q or "").strip()
        q_norm = q_norm if q_norm else None
        
        # Normalize tutor_name: treat empty/whitespace as None
        tutor_name_norm = (tutor_name or "").strip()
        tutor_name_norm = tutor_name_norm if tutor_name_norm else None
        
        # Normalize comma-separated values
        departments_norm = departments.strip().upper() if departments and departments.strip() else None
        languages_norm = languages.strip() if languages and languages.strip() else None
        course_levels_norm = course_levels.strip() if course_levels and course_levels.strip() else None
        location_modes_norm = location_modes.strip().lower() if location_modes and location_modes.strip() else None
        
        params = {
            "q": q_norm,
            "tutor_name": tutor_name_norm,
            "department": department.upper() if department else None,
            "departments": departments_norm,
            "course_number": course_number,
            "course_levels": course_levels_norm,
            "min_rate": min_rate,
            "max_rate": max_rate,
            "languages": languages_norm,
            "sort_by": sort_by.lower() if sort_by else "price",
            "sort_order": sort_order.lower() if sort_order else "asc",
            "weekday": weekday,
            "available_after": available_after,
            "available_before": available_before,
            "location_modes": location_modes_norm,
            "has_availability": has_availability,
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


@router.get("/filters", response_model=FilterOptionsResponse)
def get_filter_options_endpoint(
    db: Session = Depends(get_db)
):
    """
    Get available filter options for populating filter UI components.
    
    Returns:
    - departments: Available departments with tutor counts
    - languages: Available languages with tutor counts
    - price_range: Min and max hourly rates
    - location_modes: Available location modes with tutor counts
    - weekdays: Available weekdays with tutor counts
    """
    try:
        filter_options = get_filter_options(db)
        return FilterOptionsResponse(**filter_options)
    
    except Exception as e:
        print(f"Get filter options error: {str(e)}")
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
