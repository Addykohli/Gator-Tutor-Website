"""
Search router for tutor and course search endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..services import search_tutors, search_courses
from ..schemas import (
    TutorSearchResponse,
    TutorSearchResult,
    CourseSearchResponse,
    CourseSearchResult,
    SearchAllResponse
)


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
    
    - **q**: General search query that searches tutor names (first name, last name, or full name)
    - **tutor_name**: Search query specifically for tutor names
    - **department**: Filter tutors by department code of courses they teach
    - **course_number**: Filter tutors by course number of courses they teach
    
    Note: The `q` parameter only searches tutor names, not courses. Use `department` and `course_number` 
    parameters to filter tutors by the courses they teach.
    
    BREAKING CHANGE: As of this version, the `q` parameter no longer searches course titles.
    To find tutors by course, use `/search/tutors?department=CSC` or `/search/courses?q=python`
    followed by filtering tutors for specific courses.
    """
    try:
        params = {
            "q": q.strip() if q else None,
            "tutor_name": tutor_name.strip() if tutor_name else None,
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
    
    Returns courses with the count of approved tutors teaching each course.
    """
    try:
        params = {
            "q": q.strip() if q else None,
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


@router.get("/all", response_model=SearchAllResponse)
def search_all_endpoint(
    q: Optional[str] = Query(None, max_length=100, description="Search query for both tutors (names) and courses (titles/codes)"),
    limit: int = Query(20, ge=1, le=50, description="Total limit - will be split between tutors and courses"),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Search for both tutors and courses in a single request.
    
    Returns aggregated results with both tutors and courses matching the query.
    The limit is split between tutors and courses (limit/2 each, minimum 1).
    
    NOTE: This endpoint executes both searches sequentially. For better performance
    at scale, consider parallelizing with asyncio.gather() when moving to async endpoints.
    
    Pagination metadata (tutor_total, course_total) reflects the full result set,
    not just the returned items within the limit.
    """
    try:
        # Split limit between tutors and courses (min 1 each)
        # NOTE: Sequential execution - fine for now, but consider async parallelization later
        tutor_limit = max(1, limit // 2)
        course_limit = max(1, limit - tutor_limit)
        
        # Prepare params for both searches
        tutor_params = {
            "q": q.strip() if q else None,
            "tutor_name": None,
            "department": None,
            "course_number": None,
            "limit": tutor_limit,
            "offset": offset
        }
        
        course_params = {
            "q": q.strip() if q else None,
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

