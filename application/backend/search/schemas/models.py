"""
Pydantic models for search API responses.
"""
from typing import List, Optional
from pydantic import BaseModel


class CourseInfo(BaseModel):
    """Course information in search results."""
    department_code: str
    course_number: str
    title: str


class TutorSearchResult(BaseModel):
    """Individual tutor search result."""
    tutor_id: int
    first_name: str
    last_name: str
    hourly_rate_cents: int
    languages: List[str] = []
    avg_rating: Optional[float] = None
    sessions_completed: Optional[int] = None
    courses: List[CourseInfo] = []
    profile_image_path_thumb: Optional[str] = None
    profile_image_path_full: Optional[str] = None


class TutorSearchResponse(BaseModel):
    """Search response with pagination."""
    items: List[TutorSearchResult]
    total: int
    limit: int
    offset: int

