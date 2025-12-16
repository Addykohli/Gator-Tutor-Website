"""
Database migration script to update media paths from old format to new unified format.

This script migrates:
- chat_media.media_path: /api/chat/media/{filename} → /media/{category}/chat/{filename}
- tutor_profiles.profile_image_path_full: /static/images/... → /media/photos/profile/...
- tutor_profiles.profile_image_path_thumb: /static/images/... → /media/photos/profile/...

Run this script after migrating physical files to the server.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from search.database import SessionLocal
from chat.models.chat_media import ChatMedia
from search.models.tutor_profile import TutorProfile
from media_handling.service import get_media_category

# Image extensions
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi", ".mkv"}
PDF_EXTENSIONS = {".pdf"}


def extract_filename_from_path(path: str) -> str:
    """Extract filename from a path."""
    if not path:
        return None
    return path.split('/')[-1]


def migrate_chat_media_path(old_path: str) -> str:
    """
    Migrate old chat media path to new format.
    
    Old: /api/chat/media/{filename}
    New: /media/{category}/chat/{filename}
    """
    if not old_path:
        return old_path
    
    # If already in new format, return as-is
    if old_path.startswith('/media/'):
        return old_path
    
    # Handle old /api/chat/media/ format
    if old_path.startswith('/api/chat/media/'):
        filename = extract_filename_from_path(old_path)
        if not filename:
            return old_path
        
        # Determine category from file extension
        file_ext = os.path.splitext(filename)[1].lower()
        category = get_media_category(file_ext)
        
        return f'/media/{category}/chat/{filename}'
    
    # Unknown format, return as-is
    return old_path


def migrate_profile_image_path(old_path: str) -> str:
    """
    Migrate old profile image path to new format.
    
    Old: /static/images/... or other formats
    New: /media/photos/profile/{filename} or default
    """
    if not old_path:
        return '/media/photos/profile/default_photo.jpg'
    
    # If already in new format, return as-is
    if old_path.startswith('/media/photos/profile/'):
        return old_path
    
    # Handle old /static/images/ format
    if old_path.startswith('/static/images/') or old_path.startswith('/static/'):
        filename = extract_filename_from_path(old_path)
        if filename:
            return f'/media/photos/profile/{filename}'
    
    # Handle old /api/chat/media/ format (shouldn't happen for profiles, but handle it)
    if old_path.startswith('/api/chat/media/'):
        filename = extract_filename_from_path(old_path)
        if filename:
            return f'/media/photos/profile/{filename}'
    
    # If path doesn't match known patterns, return default
    return '/media/photos/profile/default_photo.jpg'


def migrate_chat_media_table(db: Session):
    """Migrate all chat_media records."""
    print("Migrating chat_media table...")
    
    # Find all records with old paths
    old_patterns = ['/api/chat/media/', '/static/']
    records_to_update = []
    
    all_media = db.query(ChatMedia).all()
    for media in all_media:
        if not media.media_path:
            continue
        
        # Check if path needs migration
        needs_migration = False
        for pattern in old_patterns:
            if media.media_path.startswith(pattern):
                needs_migration = True
                break
        
        # Also check if it's not already in new format
        if not needs_migration and not media.media_path.startswith('/media/'):
            needs_migration = True
        
        if needs_migration:
            records_to_update.append(media)
    
    print(f"Found {len(records_to_update)} chat_media records to migrate")
    
    updated_count = 0
    for media in records_to_update:
        old_path = media.media_path
        new_path = migrate_chat_media_path(old_path)
        
        if old_path != new_path:
            print(f"  Updating media_id {media.media_id}: {old_path} → {new_path}")
            media.media_path = new_path
            updated_count += 1
    
    if updated_count > 0:
        db.commit()
        print(f"✓ Updated {updated_count} chat_media records")
    else:
        print("✓ No chat_media records needed updating")
    
    return updated_count


def migrate_tutor_profiles_table(db: Session):
    """Migrate all tutor_profiles records."""
    print("\nMigrating tutor_profiles table...")
    
    all_profiles = db.query(TutorProfile).all()
    records_to_update = []
    
    for profile in all_profiles:
        needs_update = False
        
        # Check profile_image_path_full
        if profile.profile_image_path_full:
            if (not profile.profile_image_path_full.startswith('/media/photos/profile/') and
                (profile.profile_image_path_full.startswith('/static/') or
                 profile.profile_image_path_full.startswith('/api/') or
                 not profile.profile_image_path_full.startswith('/media/'))):
                needs_update = True
        
        # Check profile_image_path_thumb
        if profile.profile_image_path_thumb:
            if (not profile.profile_image_path_thumb.startswith('/media/photos/profile/') and
                (profile.profile_image_path_thumb.startswith('/static/') or
                 profile.profile_image_path_thumb.startswith('/api/') or
                 not profile.profile_image_path_thumb.startswith('/media/'))):
                needs_update = True
        
        if needs_update:
            records_to_update.append(profile)
    
    print(f"Found {len(records_to_update)} tutor_profiles records to migrate")
    
    updated_count = 0
    for profile in records_to_update:
        updated = False
        
        # Update profile_image_path_full
        if profile.profile_image_path_full:
            old_path = profile.profile_image_path_full
            new_path = migrate_profile_image_path(old_path)
            if old_path != new_path:
                print(f"  Updating tutor_id {profile.tutor_id} profile_image_path_full: {old_path} → {new_path}")
                profile.profile_image_path_full = new_path
                updated = True
        
        # Update profile_image_path_thumb
        if profile.profile_image_path_thumb:
            old_path = profile.profile_image_path_thumb
            new_path = migrate_profile_image_path(old_path)
            if old_path != new_path:
                print(f"  Updating tutor_id {profile.tutor_id} profile_image_path_thumb: {old_path} → {new_path}")
                profile.profile_image_path_thumb = new_path
                updated = True
        
        if updated:
            updated_count += 1
    
    if updated_count > 0:
        db.commit()
        print(f"✓ Updated {updated_count} tutor_profiles records")
    else:
        print("✓ No tutor_profiles records needed updating")
    
    return updated_count


def main():
    """Main migration function."""
    print("=" * 60)
    print("Media Paths Migration Script")
    print("=" * 60)
    print()
    print("This script will update database paths from old format to new format:")
    print("  - chat_media: /api/chat/media/... → /media/{category}/chat/...")
    print("  - tutor_profiles: /static/... → /media/photos/profile/...")
    print()
    
    response = input("Do you want to continue? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print("Migration cancelled.")
        return
    
    db = SessionLocal()
    try:
        chat_media_count = migrate_chat_media_table(db)
        tutor_profiles_count = migrate_tutor_profiles_table(db)
        
        print()
        print("=" * 60)
        print("Migration Summary")
        print("=" * 60)
        print(f"chat_media records updated: {chat_media_count}")
        print(f"tutor_profiles records updated: {tutor_profiles_count}")
        print(f"Total records updated: {chat_media_count + tutor_profiles_count}")
        print()
        print("✓ Migration completed successfully!")
        print()
        print("Note: Make sure physical files have been migrated to the server")
        print("      at /home/atharva/media/ before using these new paths.")
        
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error during migration: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

