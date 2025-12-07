# search/schemas/tutor_profile_schema.py
from pydantic import BaseModel
from typing import Optional

class TutorProfileResponse(BaseModel):
    tutor_id: int
    bio: Optional[str]
    hourly_rate_cents: int
    languages: Optional[str]
    status: str
