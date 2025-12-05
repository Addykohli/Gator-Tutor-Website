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


class CourseSearchResult(BaseModel):
    """Individual course search result."""
    course_id: int
    department_code: str
    course_number: str
    title: str
    tutor_count: int = 0


class CourseSearchResponse(BaseModel):
    """Course search response with pagination."""
    items: List[CourseSearchResult]
    total: int
    limit: int
    offset: int


class TutorDetailResponse(BaseModel):
    """Detailed tutor profile information."""
    id: int
    first_name: str
    last_name: str
    email: str
    hourly_rate_cents: int
    bio: Optional[str] = None
    courses: List[CourseInfo] = []
    languages: List[str] = []
    avg_rating: Optional[float] = None
    sessions_completed: Optional[int] = None
    profile_image_path_full: Optional[str] = None
    profile_image_path_thumb: Optional[str] = None


class SearchAllResponse(BaseModel):
    """Aggregated search response with both tutors and courses."""
    tutors: List[TutorSearchResult]
    courses: List[CourseSearchResult]
    tutor_total: int
    course_total: int
    limit: int
    offset: int


class DepartmentFilterOption(BaseModel):
    """Department filter option with count."""
    code: str
    count: int


class LanguageFilterOption(BaseModel):
    """Language filter option with count."""
    name: str
    count: int


class PriceRangeOption(BaseModel):
    """Price range filter option."""
    min: int
    max: int


class LocationModeOption(BaseModel):
    """Location mode filter option with count."""
    mode: str
    count: int


class WeekdayOption(BaseModel):
    """Weekday filter option with count."""
    weekday: int
    count: int


class FilterOptionsResponse(BaseModel):
    """Filter options response for search UI."""
    departments: List[DepartmentFilterOption]
    languages: List[LanguageFilterOption]
    price_range: PriceRangeOption
    location_modes: List[LocationModeOption]
    weekdays: List[WeekdayOption]

