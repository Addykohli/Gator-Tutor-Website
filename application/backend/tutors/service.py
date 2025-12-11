from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from search.models.tutor_profile import TutorProfile

def update_tutor_price(db: Session, tutor_id: int, hourly_rate_cents: int) -> TutorProfile:
  
    if hourly_rate_cents < 0:
        raise ValueError("hourly rate must be positive")

    profile = db.query(TutorProfile).filter(TutorProfile.tutor_id == tutor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="tutor profile not found")

    profile.hourly_rate_cents = hourly_rate_cents
    db.commit()
    db.refresh(profile)
    return profile

def update_tutor_bio(db: Session, tutor_id: int, bio: Optional[str]) -> TutorProfile:
 
    if bio is not None and len(bio) > 250:
        raise ValueError("bio must be 250 characters or less")

    profile = db.query(TutorProfile).filter(TutorProfile.tutor_id == tutor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="tutor profile not found")

    profile.bio = bio
    db.commit()
    db.refresh(profile)
    return profile

def update_tutor_languages(db: Session, tutor_id: int, languages: Optional[List[str]]) -> TutorProfile:
    
    profile = db.query(TutorProfile).filter(TutorProfile.tutor_id == tutor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="tutor profile not found")

    if languages is None:
        profile.languages = None
    else:
        if not languages:
            raise ValueError("language not provided")

        if any(len(lang) > 50 for lang in languages):
            raise ValueError("each language must be 50 characters or less")

        languages_str = ", ".join(languages)
        if len(languages_str) > 250:
            raise ValueError("languages must be 250 characters or less")

        profile.languages = languages_str

    db.commit()
    db.refresh(profile)
    return profile