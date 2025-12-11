from typing import Optional, List
from pydantic import BaseModel, Field

class TutorPriceUpdate(BaseModel):
    hourly_rate_cents: int = Field(..., ge=0)

class TutorPriceResponse(BaseModel):
    tutor_id: int
    hourly_rate_cents: int

class TutorBioUpdate(BaseModel):
    bio: Optional[str] = Field(None, max_length=250)

class TutorBioResponse(BaseModel):
    tutor_id: int
    bio: Optional[str]

class TutorLanguagesUpdate(BaseModel):
    languages: Optional[List[str]] = None

class TutorLanguagesResponse(BaseModel):
    tutor_id: int
    languages: List[str]