"""
Media service for handling file uploads and storage.
Files are stored on the server at /home/atharva/media/ and served by nginx at /media/
"""
import os
import uuid
from typing import Optional
from fastapi import UploadFile

# Media root directory on server
# For local development on Windows, use relative path from backend directory
if os.getenv("MEDIA_ROOT"):
    MEDIA_ROOT = os.getenv("MEDIA_ROOT")
elif os.name == 'nt':  # Windows
    MEDIA_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "multimedia")
else:
    MEDIA_ROOT = "/home/atharva/media"

# Supported image extensions
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
# Supported video extensions
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi", ".mkv"}
# Supported PDF extensions
PDF_EXTENSIONS = {".pdf"}


def get_media_category(file_ext: str) -> str:
    """
    Determine media category based on file extension.
    
    Args:
        file_ext: File extension (e.g., ".jpg", ".pdf")
        
    Returns:
        Category string: "photos", "videos", or "pdfs"
    """
    file_ext_lower = file_ext.lower()
    if file_ext_lower in IMAGE_EXTENSIONS:
        return "photos"
    elif file_ext_lower in VIDEO_EXTENSIONS:
        return "videos"
    elif file_ext_lower in PDF_EXTENSIONS:
        return "pdfs"
    else:
        # Default to photos for unknown types
        return "photos"


def get_media_subdirectory(category: str, context: str = "chat") -> str:
    """
    Get the subdirectory path for a media file.
    
    Args:
        category: Media category ("photos", "videos", "pdfs")
        context: Context where media is used ("chat", "profile", etc.)
        
    Returns:
        Subdirectory path relative to MEDIA_ROOT (e.g., "photos/chat")
    """
    return f"{category}/{context}"


async def save_media_file(
    file: UploadFile,
    context: str = "chat",
    user_id: Optional[int] = None
) -> str:
    """
    Save an uploaded file to the media directory and return the relative path.
    
    Args:
        file: FastAPI UploadFile object
        context: Context where media is used ("chat", "profile", etc.)
        user_id: Optional user ID for profile images (e.g., "{user_id}_profile_{uuid}.jpg")
        
    Returns:
        Relative path from media root (e.g., "/media/photos/chat/{uuid}.jpg")
        This path is what should be stored in the database and used in frontend URLs.
        
    Raises:
        OSError: If file cannot be written
    """
    # Get file extension
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    if not file_ext:
        file_ext = ".bin"  # Default extension if none provided
    
    # Determine category and subdirectory
    category = get_media_category(file_ext)
    subdir = get_media_subdirectory(category, context)
    
    # Generate unique filename
    if context == "profile" and user_id:
        # Profile images: {user_id}_profile_{uuid}.{ext}
        unique_filename = f"{user_id}_profile_{uuid.uuid4()}{file_ext}"
    else:
        # Chat and other media: {uuid}.{ext}
        unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Full directory path on server
    full_dir = os.path.join(MEDIA_ROOT, subdir)
    
    # Create directory if it doesn't exist
    os.makedirs(full_dir, exist_ok=True)
    
    # Full file path on server
    full_file_path = os.path.join(full_dir, unique_filename)
    
    # Read file content (async)
    file_content = await file.read()
    
    # Save file
    with open(full_file_path, "wb") as f:
        f.write(file_content)
    
    # Return relative path for database/frontend (starts with /media/)
    return f"/media/{subdir}/{unique_filename}"


def delete_media_file(media_path: str) -> bool:
    """
    Delete a media file from the server.
    
    Args:
        media_path: Relative path from media root (e.g., "/media/photos/chat/{uuid}.jpg")
        
    Returns:
        True if file was deleted, False if file didn't exist
    """
    if not media_path or not media_path.startswith("/media/"):
        return False
    
    # Remove /media/ prefix to get relative path from MEDIA_ROOT
    relative_path = media_path[len("/media/"):]
    full_path = os.path.join(MEDIA_ROOT, relative_path)
    
    if os.path.exists(full_path):
        os.remove(full_path)
        return True
    return False


def get_full_file_path(media_path: str) -> Optional[str]:
    """
    Get the full file system path for a media path.
    
    Args:
        media_path: Relative path from media root (e.g., "/media/photos/chat/{uuid}.jpg")
        
    Returns:
        Full file system path, or None if path is invalid
    """
    if not media_path or not media_path.startswith("/media/"):
        return None
    
    # Remove /media/ prefix to get relative path from MEDIA_ROOT
    relative_path = media_path[len("/media/"):]
    full_path = os.path.join(MEDIA_ROOT, relative_path)
    
    return full_path if os.path.exists(full_path) else None

