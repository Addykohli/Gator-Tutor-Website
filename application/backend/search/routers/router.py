"""
Search router for tutor search endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..services import search_tutors
from ..schemas import TutorSearchResponse, TutorSearchResult


router = APIRouter(prefix="/search", tags=["search"])


@router.get("/tutors", response_model=TutorSearchResponse)
def search_tutors_endpoint(
    q: Optional[str] = Query(None, max_length=100),
    tutor_name: Optional[str] = Query(None, max_length=100),
    department: Optional[str] = Query(None, max_length=10),
    course_number: Optional[str] = Query(None, max_length=10),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Search for tutors by name or course."""
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
        print(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

