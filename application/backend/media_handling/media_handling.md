# Media Handling System Documentation

## Overview

The media handling system provides a unified approach to storing and serving media files (images, videos, PDFs) across the application. All media files are stored on the server at `/home/atharva/media/` and served directly by nginx at the `/media/` route, eliminating the need for FastAPI endpoints to serve files.

## Architecture

### Storage Location
- **Server Path**: `/home/atharva/media/`
- **Web Route**: `/media/` (served by nginx)
- **Database Storage**: Relative paths like `/media/photos/chat/{uuid}.jpg`

### Flow Diagram

```
Upload Flow:
Frontend → POST /api/chat/send-media → Backend API
  → media_handling.service.save_media_file()
  → Save to /home/atharva/media/{category}/{context}/{filename}
  → Return /media/{category}/{context}/{filename}
  → Store in database
  → Return to frontend

Serving Flow:
Frontend → Constructs URL from /media/... path
  → Nginx serves directly from /home/atharva/media/
  → No backend API call needed
```

## Directory Structure

```
/home/atharva/media/
├── photos/
│   ├── profile/
│   │   ├── default_photo.jpg          # Default fallback image
│   │   └── {user_id}_profile_{uuid}.{ext}  # User profile images
│   └── chat/
│       └── {uuid}.{ext}                # Chat images
├── videos/
│   └── chat/
│       └── {uuid}.{ext}                # Chat videos
└── pdfs/
    └── chat/
        └── {uuid}.{ext}                # Chat PDFs
```

### File Naming Conventions

- **Profile Images**: `{user_id}_profile_{uuid}.{ext}`
  - Example: `5_profile_a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`
  
- **Chat Media**: `{uuid}.{ext}`
  - Example: `442b0fd2-30ee-4c26-9a04-f2f684c69c36.png`

### File Type Categorization

Files are automatically categorized based on extension:

- **Photos**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`
- **Videos**: `.mp4`, `.webm`, `.mov`, `.avi`, `.mkv`
- **PDFs**: `.pdf`
- **Default**: Unknown extensions default to `photos` category

## API Usage

### Backend Service

The `media_handling/service.py` module provides the following functions:

#### `save_media_file(file, context, user_id=None)`

Saves an uploaded file to the media directory and returns the relative path.

**Parameters:**
- `file`: FastAPI `UploadFile` object
- `context`: Context where media is used (`"chat"`, `"profile"`, etc.)
- `user_id`: Optional user ID for profile images

**Returns:**
- Relative path string (e.g., `/media/photos/chat/{uuid}.jpg`)

**Example:**
```python
from media_handling.service import save_media_file
from fastapi import UploadFile

# In a FastAPI endpoint
async def upload_endpoint(file: UploadFile):
    media_path = await save_media_file(file, context="chat")
    # media_path = "/media/photos/chat/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png"
    # Save to database...
```

#### `delete_media_file(media_path)`

Deletes a media file from the server.

**Parameters:**
- `media_path`: Relative path (e.g., `/media/photos/chat/{uuid}.jpg`)

**Returns:**
- `True` if deleted, `False` if file didn't exist

#### `get_full_file_path(media_path)`

Gets the full file system path for a media path.

**Parameters:**
- `media_path`: Relative path (e.g., `/media/photos/chat/{uuid}.jpg`)

**Returns:**
- Full file system path or `None` if invalid

### Environment Configuration

The service uses the `MEDIA_ROOT` environment variable:

```bash
MEDIA_ROOT=/home/atharva/media
```

If not set, it defaults to `/home/atharva/media`.

## Integration Examples

### Chat Media Upload

```python
# application/backend/chat/routers/chat_router.py
from media_handling.service import save_media_file

@router.post("/send-media")
async def send_media_endpoint(
    file: UploadFile = File(...),
    receiver_id: int = Form(...),
    db: Session = Depends(get_db),
    user_id: int = None
):
    # Save file using media service
    media_path = await save_media_file(file, context="chat")
    
    # Store in database
    message, media = send_message_with_media(
        db, user_id, receiver_id, content, media_path, file.content_type
    )
    
    return MessageResponse(
        media_path=media.media_path,  # "/media/photos/chat/{uuid}.jpg"
        ...
    )
```

### Profile Image Upload

```python
# Example for profile image upload
async def upload_profile_image(file: UploadFile, user_id: int):
    media_path = await save_media_file(
        file, 
        context="profile", 
        user_id=user_id
    )
    # media_path = "/media/photos/profile/5_profile_{uuid}.jpg"
    # Update tutor_profiles table...
```

## Database Schema

### chat_media Table

```sql
CREATE TABLE chat_media (
    media_id INT PRIMARY KEY,
    message_id INT FOREIGN KEY,
    media_path VARCHAR(500),  -- Stores: "/media/photos/chat/{uuid}.jpg"
    media_type VARCHAR(500),  -- e.g., "image/png", "application/pdf"
    created_at DATETIME
);
```

### tutor_profiles Table

```sql
CREATE TABLE tutor_profiles (
    tutor_id INT PRIMARY KEY,
    profile_image_path_full VARCHAR(500),  -- "/media/photos/profile/{filename}"
    profile_image_path_thumb VARCHAR(500), -- "/media/photos/profile/{filename}"
    ...
);
```

## Migration History

### Migration from Old System

The system was migrated from the old architecture:

**Old System:**
- Files stored in: `application/backend/uploads/chat_media/`
- Served via: `/api/chat/media/{filename}` endpoint
- Database paths: `/api/chat/media/{filename}`
- Profile images: `/static/images/...` or `assets/...`

**New System:**
- Files stored in: `/home/atharva/media/{category}/{context}/`
- Served via: nginx `/media/` route
- Database paths: `/media/{category}/{context}/{filename}`
- Profile images: `/media/photos/profile/{filename}`

### Migration Scripts

#### Database Migration

**File**: `application/backend/migrations/migrate_media_paths.py`

Migrates database paths from old format to new format:
- `chat_media.media_path`: `/api/chat/media/{filename}` → `/media/{category}/chat/{filename}`
- `tutor_profiles.profile_image_path_full`: `/static/...` → `/media/photos/profile/...`
- `tutor_profiles.profile_image_path_thumb`: `/static/...` → `/media/photos/profile/...`

**Usage:**
```bash
cd application/backend
source .venv/bin/activate
python3 migrations/migrate_media_paths.py
```

#### File Migration

**File**: `application/backend/scripts/migrate_uploads_to_server.sh`

Moves physical files from old location to new server structure.

**Usage (on server):**
```bash
bash scripts/migrate_uploads_to_server.sh
```

### Migration Results

**Database Migration (Completed):**
- 7 `chat_media` records updated
- 2 `tutor_profiles` records updated
- Total: 9 records migrated

**File Migration:**
- No old files found on server (may have never existed or were already cleaned up)
- Media directory structure created and ready

## Nginx Configuration

The nginx configuration includes a `/media/` location block:

```nginx
# Serve media files directly (before API routes)
location /media/ {
    alias /home/atharva/media/;
    expires 30d;
    add_header Cache-Control "public";
    autoindex off;
    
    # Security: prevent directory listing
    location ~ /\. {
        deny all;
    }
}
```

This configuration:
- Serves files directly from `/home/atharva/media/`
- Sets 30-day cache expiration
- Prevents directory listing
- Blocks access to hidden files

## Deployment

### Automatic Setup

The deployment script (`scripts/deploy.sh`) automatically:
1. Creates media directory structure
2. Sets proper permissions (755)
3. Migrates old uploads (if they exist)
4. Warns if default image is missing

### Manual Setup

If setting up manually on the server:

```bash
# Create directories
sudo mkdir -p /home/atharva/media/{photos/{profile,chat},videos/chat,pdfs/chat}

# Set permissions
sudo chown -R atharva:atharva /home/atharva/media
sudo chmod 755 /home/atharva/media
sudo chmod -R 755 /home/atharva/media/*

# Copy default profile image (if needed)
# sudo cp default_photo.jpg /home/atharva/media/photos/profile/
```

## Frontend Integration

The frontend uses the `media_handling` module to construct URLs:

```javascript
// application/client/src/media_handling/mediaUrl.js
import { getMediaUrl, getProfileImageUrl } from '../media_handling';

// Chat media
const chatImageUrl = getMediaUrl(message.media_path);
// Converts: "/media/photos/chat/uuid.jpg"
// To: "https://your-domain.com/media/photos/chat/uuid.jpg"

// Profile image with default fallback
const profileUrl = getProfileImageUrl(tutor.profile_image_path_full);
// Returns default if path is null/empty
```

## Security Considerations

1. **File Type Validation**: Files are categorized by extension, but additional validation should be added in upload endpoints
2. **File Size Limits**: Configured in nginx (`client_max_body_size 16m`)
3. **Directory Listing**: Disabled in nginx configuration
4. **Hidden Files**: Blocked via nginx rules
5. **Permissions**: Media directories are readable by nginx, writable only by application user

## Troubleshooting

### Files Not Accessible

1. **Check nginx configuration**: Verify `/media/` location block exists
2. **Check file permissions**: `ls -la /home/atharva/media/`
3. **Check nginx user**: Ensure nginx can read files
4. **Test direct access**: `curl http://your-domain.com/media/photos/profile/default_photo.jpg`

### Upload Failures

1. **Check disk space**: `df -h /home/atharva/media`
2. **Check permissions**: Application user must be able to write
3. **Check MEDIA_ROOT**: Verify environment variable is set correctly
4. **Check logs**: Backend application logs for errors

### Database Path Issues

1. **Verify paths start with `/media/`**: All paths should be relative from media root
2. **Run migration script**: If old paths exist, run `migrate_media_paths.py`
3. **Check file existence**: Verify files exist at paths stored in database

## Best Practices

1. **Always use `save_media_file()`**: Don't save files directly
2. **Store relative paths**: Database should store `/media/...` paths, not full URLs
3. **Use context parameter**: Specify `"chat"`, `"profile"`, etc. for proper organization
4. **Handle errors**: Wrap file operations in try/except blocks
5. **Clean up**: Delete old files when records are deleted
6. **Backup**: Regularly backup `/home/atharva/media/` directory

## Future Enhancements

Potential improvements:
- Image resizing/thumbnailing for profile images
- File validation (MIME type checking, virus scanning)
- CDN integration for better performance
- Automatic cleanup of orphaned files
- File versioning for profile images
- Compression for large files

## Related Files

- **Service Module**: `application/backend/media_handling/service.py`
- **Database Migration**: `application/backend/migrations/migrate_media_paths.py`
- **File Migration Script**: `application/backend/scripts/migrate_uploads_to_server.sh`
- **Deployment Script**: `application/backend/scripts/deploy.sh`
- **Nginx Config**: `application/backend/scripts/templates/nginx.conf.j2`
- **Frontend Module**: `application/client/src/media_handling/mediaUrl.js`

## Support

For issues or questions:
1. Check this documentation
2. Review migration scripts for examples
3. Check application logs
4. Verify nginx configuration
5. Contact backend team lead

