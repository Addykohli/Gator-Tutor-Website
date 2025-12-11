from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from search.database import get_db
from .schemas import (
    TutorPriceUpdate,
    TutorPriceResponse,
    TutorBioUpdate,
    TutorBioResponse,
    TutorLanguagesUpdate,
    TutorLanguagesResponse,
)
from .service import update_tutor_price, update_tutor_bio, update_tutor_languages

router = APIRouter(prefix="/api/tutors", tags=["tutors"])

@router.patch("/{tutor_id}/price", response_model=TutorPriceResponse)
def update_tutor_price_endpoint(
    tutor_id: int,
    tutor_price_update: TutorPriceUpdate,
    db: Session = Depends(get_db)
):
    
    try:
        profile = update_tutor_price(db, tutor_id, tutor_price_update.hourly_rate_cents)
        return TutorPriceResponse(
            tutor_id=profile.tutor_id,
            hourly_rate_cents=profile.hourly_rate_cents
        )
    
    except HTTPException:
        raise
    
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    
    except Exception as error:
        print(f"price update error: {error}")
        raise HTTPException(status_code=500, detail="server error")

@router.patch("/{tutor_id}/bio", response_model=TutorBioResponse)
def update_tutor_bio_endpoint(
    tutor_id: int,
    tutor_bio_update: TutorBioUpdate,
    db: Session = Depends(get_db)
):

    try:
        profile = update_tutor_bio(db, tutor_id, tutor_bio_update.bio)
        return TutorBioResponse(
            tutor_id=profile.tutor_id,
            bio=profile.bio
        )

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        print(f"bio update error: {error}")
        raise HTTPException(status_code=500, detail="server error")

@router.patch("/{tutor_id}/languages", response_model=TutorLanguagesResponse)
def update_tutor_languages_endpoint(
    tutor_id: int,
    tutor_languages_update: TutorLanguagesUpdate,
    db: Session = Depends(get_db)
):
  
    try:
        profile = update_tutor_languages(db, tutor_id, tutor_languages_update.languages)
        languages_list = profile.get_languages()
        return TutorLanguagesResponse(
            tutor_id=profile.tutor_id,
            languages=languages_list
        )

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except Exception as error:
        print(f"languages update error: {error}")
        raise HTTPException(status_code=500, detail="server error")