from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
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
from .service import update_tutor_price, update_tutor_bio, update_tutor_languages, update_tutor_profile_image
from media_handling.service import save_media_file

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

@router.post("/{tutor_id}/profile-image")
async def upload_profile_image_endpoint(
    tutor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a profile image for a tutor.
    Accepts image files (jpg, png, gif, webp).
    Returns the new profile image URL.
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (max 5MB)
    MAX_SIZE = 5 * 1024 * 1024  # 5MB
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image must be less than 5MB")
    
    # Reset file position for save_media_file
    await file.seek(0)
    
    try:
        # Save the file using media_handling service
        media_path = await save_media_file(file, context="profile", user_id=tutor_id)
        
        # Update the tutor profile in database
        profile = update_tutor_profile_image(db, tutor_id, media_path)
        
        return {
            "tutor_id": profile.tutor_id,
            "profile_image_path_full": profile.profile_image_path_full,
            "profile_image_path_thumb": profile.profile_image_path_thumb,
            "message": "Profile image updated successfully"
        }
    
    except HTTPException:
        raise
    
    except Exception as error:
        print(f"Profile image upload error: {error}")
        raise HTTPException(status_code=500, detail="Failed to upload profile image")