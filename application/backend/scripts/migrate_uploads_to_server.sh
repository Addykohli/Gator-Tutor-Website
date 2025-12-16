#!/bin/bash
# Migration script to move files from uploads/chat_media/ to server media directories
# This script should be run on the server where files will be stored

set -e  # Exit on error

# Configuration
MEDIA_ROOT="/home/atharva/media"
OLD_UPLOADS_DIR="${1:-/home/atharva/csc648-fa25-145-team08/application/backend/uploads/chat_media}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Media Files Migration Script"
echo "=========================================="
echo ""
echo "Source directory: $OLD_UPLOADS_DIR"
echo "Destination root: $MEDIA_ROOT"
echo ""

# Check if old uploads directory exists
if [ ! -d "$OLD_UPLOADS_DIR" ]; then
    echo -e "${YELLOW}Warning: Source directory not found: $OLD_UPLOADS_DIR${NC}"
    echo "Nothing to migrate."
    exit 0
fi

# Check if directory has files
if [ ! "$(ls -A $OLD_UPLOADS_DIR 2>/dev/null)" ]; then
    echo -e "${YELLOW}Source directory is empty. Nothing to migrate.${NC}"
    exit 0
fi

# Create media directory structure
echo "Creating media directory structure..."
mkdir -p "$MEDIA_ROOT/photos/chat"
mkdir -p "$MEDIA_ROOT/videos/chat"
mkdir -p "$MEDIA_ROOT/pdfs/chat"
chmod 755 "$MEDIA_ROOT"
chmod -R 755 "$MEDIA_ROOT"/*

# Function to get file category based on extension
get_file_category() {
    local filename="$1"
    local ext="${filename##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
    
    case "$ext" in
        jpg|jpeg|png|gif|webp|bmp)
            echo "photos"
            ;;
        mp4|webm|mov|avi|mkv)
            echo "videos"
            ;;
        pdf)
            echo "pdfs"
            ;;
        *)
            # Default to photos for unknown types
            echo "photos"
            ;;
    esac
}

# Count files
file_count=$(find "$OLD_UPLOADS_DIR" -type f | wc -l)
echo "Found $file_count files to migrate"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with migration? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Migrate files
migrated_count=0
photos_count=0
videos_count=0
pdfs_count=0
errors=0

echo "Starting migration..."
echo ""

for file in "$OLD_UPLOADS_DIR"/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        category=$(get_file_category "$filename")
        dest_dir="$MEDIA_ROOT/$category/chat"
        dest_path="$dest_dir/$filename"
        
        # Check if file already exists at destination
        if [ -f "$dest_path" ]; then
            echo -e "${YELLOW}  Skipping $filename (already exists at destination)${NC}"
            continue
        fi
        
        # Move file
        if mv "$file" "$dest_path" 2>/dev/null; then
            echo -e "${GREEN}  ✓ Moved $filename → $category/chat/${NC}"
            migrated_count=$((migrated_count + 1))
            
            case "$category" in
                photos) photos_count=$((photos_count + 1)) ;;
                videos) videos_count=$((videos_count + 1)) ;;
                pdfs) pdfs_count=$((pdfs_count + 1)) ;;
            esac
        else
            echo -e "${RED}  ✗ Failed to move $filename${NC}"
            errors=$((errors + 1))
        fi
    fi
done

echo ""
echo "=========================================="
echo "Migration Summary"
echo "=========================================="
echo -e "${GREEN}Total files migrated: $migrated_count${NC}"
echo "  - Photos: $photos_count"
echo "  - Videos: $videos_count"
echo "  - PDFs: $pdfs_count"
if [ $errors -gt 0 ]; then
    echo -e "${RED}Errors: $errors${NC}"
fi
echo ""

# Check if old directory is now empty
remaining_files=$(find "$OLD_UPLOADS_DIR" -type f 2>/dev/null | wc -l)
if [ "$remaining_files" -eq 0 ]; then
    echo -e "${GREEN}✓ All files migrated successfully${NC}"
    echo ""
    echo "The old directory is now empty. You can safely remove it:"
    echo "  rm -rf $OLD_UPLOADS_DIR"
else
    echo -e "${YELLOW}Warning: $remaining_files files remain in source directory${NC}"
    echo "These files may have failed to migrate or were added during migration."
fi

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo "1. Verify files are accessible via nginx at /media/ route"
echo "2. Run database migration script to update paths:"
echo "   python3 application/backend/migrations/migrate_media_paths.py"
echo "3. Test that media files load correctly in the application"
echo "4. Once verified, remove the old uploads directory"
echo ""

