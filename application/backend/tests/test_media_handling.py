"""
Tests for media handling functionality.

Tests cover:
- Media file saving and path generation
- File categorization (photos, videos, PDFs)
- Path format validation
- File deletion
- Integration with chat media upload
"""

import pytest
import os
import tempfile
import shutil
from io import BytesIO
from pathlib import Path
from fastapi import UploadFile
from unittest.mock import Mock, patch

# Import will be reloaded in fixture, so import here for type hints
from media_handling import service as media_service_module


@pytest.fixture
def temp_media_root(monkeypatch):
    """Create a temporary media root directory for testing."""
    temp_dir = tempfile.mkdtemp()
    original_media_root = os.environ.get("MEDIA_ROOT")
    
    # Set environment variable
    monkeypatch.setenv("MEDIA_ROOT", temp_dir)
    
    # Patch the MEDIA_ROOT in the service module
    import media_handling.service
    original_media_root_attr = media_handling.service.MEDIA_ROOT
    media_handling.service.MEDIA_ROOT = temp_dir
    
    yield temp_dir
    
    # Restore
    media_handling.service.MEDIA_ROOT = original_media_root_attr
    if original_media_root:
        monkeypatch.setenv("MEDIA_ROOT", original_media_root)
    else:
        monkeypatch.delenv("MEDIA_ROOT", raising=False)
    
    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sample_image_file():
    """Create a sample image file for testing."""
    file_content = b"fake image content"
    file = BytesIO(file_content)
    file.name = "test_image.jpg"
    return file


@pytest.fixture
def sample_pdf_file():
    """Create a sample PDF file for testing."""
    file_content = b"%PDF-1.4 fake pdf content"
    file = BytesIO(file_content)
    file.name = "test_document.pdf"
    return file


@pytest.fixture
def sample_video_file():
    """Create a sample video file for testing."""
    file_content = b"fake video content"
    file = BytesIO(file_content)
    file.name = "test_video.mp4"
    return file


class TestMediaCategory:
    """Tests for file categorization."""
    
    def test_image_extensions(self, temp_media_root):
        """Test that image extensions are correctly identified."""
        from media_handling.service import get_media_category
        assert get_media_category(".jpg") == "photos"
        assert get_media_category(".jpeg") == "photos"
        assert get_media_category(".png") == "photos"
        assert get_media_category(".gif") == "photos"
        assert get_media_category(".webp") == "photos"
        assert get_media_category(".bmp") == "photos"
    
    def test_video_extensions(self, temp_media_root):
        """Test that video extensions are correctly identified."""
        from media_handling.service import get_media_category
        assert get_media_category(".mp4") == "videos"
        assert get_media_category(".webm") == "videos"
        assert get_media_category(".mov") == "videos"
        assert get_media_category(".avi") == "videos"
        assert get_media_category(".mkv") == "videos"
    
    def test_pdf_extensions(self, temp_media_root):
        """Test that PDF extensions are correctly identified."""
        from media_handling.service import get_media_category
        assert get_media_category(".pdf") == "pdfs"
    
    def test_unknown_extension_defaults_to_photos(self, temp_media_root):
        """Test that unknown extensions default to photos category."""
        from media_handling.service import get_media_category
        assert get_media_category(".unknown") == "photos"
        assert get_media_category(".bin") == "photos"
    
    def test_case_insensitive(self, temp_media_root):
        """Test that extension matching is case insensitive."""
        from media_handling.service import get_media_category
        assert get_media_category(".JPG") == "photos"
        assert get_media_category(".PDF") == "pdfs"
        assert get_media_category(".Mp4") == "videos"


class TestMediaSubdirectory:
    """Tests for subdirectory generation."""
    
    def test_chat_photos_subdirectory(self, temp_media_root):
        """Test chat photos subdirectory."""
        from media_handling.service import get_media_subdirectory
        assert get_media_subdirectory("photos", "chat") == "photos/chat"
    
    def test_profile_photos_subdirectory(self, temp_media_root):
        """Test profile photos subdirectory."""
        from media_handling.service import get_media_subdirectory
        assert get_media_subdirectory("photos", "profile") == "photos/profile"
    
    def test_chat_videos_subdirectory(self, temp_media_root):
        """Test chat videos subdirectory."""
        from media_handling.service import get_media_subdirectory
        assert get_media_subdirectory("videos", "chat") == "videos/chat"
    
    def test_chat_pdfs_subdirectory(self, temp_media_root):
        """Test chat PDFs subdirectory."""
        from media_handling.service import get_media_subdirectory
        assert get_media_subdirectory("pdfs", "chat") == "pdfs/chat"


class TestSaveMediaFile:
    """Tests for saving media files."""
    
    @pytest.mark.asyncio
    async def test_save_chat_image(self, temp_media_root, sample_image_file):
        """Test saving a chat image file."""
        from media_handling.service import save_media_file, get_full_file_path
        upload_file = UploadFile(file=sample_image_file, filename="test_image.jpg")
        
        media_path = await save_media_file(upload_file, context="chat")
        
        # Verify path format
        assert media_path.startswith("/media/photos/chat/")
        assert media_path.endswith(".jpg")
        
        # Verify file exists
        full_path = get_full_file_path(media_path)
        assert full_path is not None
        assert os.path.exists(full_path)
        
        # Verify file content
        with open(full_path, "rb") as f:
            assert f.read() == b"fake image content"
    
    @pytest.mark.asyncio
    async def test_save_chat_pdf(self, temp_media_root, sample_pdf_file):
        """Test saving a chat PDF file."""
        from media_handling.service import save_media_file, get_full_file_path
        upload_file = UploadFile(file=sample_pdf_file, filename="test_document.pdf")
        
        media_path = await save_media_file(upload_file, context="chat")
        
        # Verify path format
        assert media_path.startswith("/media/pdfs/chat/")
        assert media_path.endswith(".pdf")
        
        # Verify file exists
        full_path = get_full_file_path(media_path)
        assert full_path is not None
        assert os.path.exists(full_path)
    
    @pytest.mark.asyncio
    async def test_save_chat_video(self, temp_media_root, sample_video_file):
        """Test saving a chat video file."""
        from media_handling.service import save_media_file, get_full_file_path
        upload_file = UploadFile(file=sample_video_file, filename="test_video.mp4")
        
        media_path = await save_media_file(upload_file, context="chat")
        
        # Verify path format
        assert media_path.startswith("/media/videos/chat/")
        assert media_path.endswith(".mp4")
        
        # Verify file exists
        full_path = get_full_file_path(media_path)
        assert full_path is not None
        assert os.path.exists(full_path)
    
    @pytest.mark.asyncio
    async def test_save_profile_image(self, temp_media_root, sample_image_file):
        """Test saving a profile image with user ID."""
        from media_handling.service import save_media_file, get_full_file_path
        upload_file = UploadFile(file=sample_image_file, filename="profile.jpg")
        user_id = 123
        
        media_path = await save_media_file(upload_file, context="profile", user_id=user_id)
        
        # Verify path format includes user_id
        assert media_path.startswith("/media/photos/profile/")
        assert "123_profile_" in media_path
        assert media_path.endswith(".jpg")
        
        # Verify file exists
        full_path = get_full_file_path(media_path)
        assert full_path is not None
        assert os.path.exists(full_path)
    
    @pytest.mark.asyncio
    async def test_save_file_creates_directory(self, temp_media_root, sample_image_file):
        """Test that save_media_file creates directories if they don't exist."""
        from media_handling.service import save_media_file
        upload_file = UploadFile(file=sample_image_file, filename="test.jpg")
        
        # Directory shouldn't exist initially
        photos_chat_dir = os.path.join(temp_media_root, "photos", "chat")
        assert not os.path.exists(photos_chat_dir)
        
        await save_media_file(upload_file, context="chat")
        
        # Directory should be created
        assert os.path.exists(photos_chat_dir)
    
    @pytest.mark.asyncio
    async def test_save_file_without_extension(self, temp_media_root):
        """Test saving file without extension defaults to .bin."""
        from media_handling.service import save_media_file
        file_content = b"some content"
        file = BytesIO(file_content)
        file.name = "test_file"
        upload_file = UploadFile(file=file, filename="test_file")
        
        media_path = await save_media_file(upload_file, context="chat")
        
        # Should default to photos category
        assert media_path.startswith("/media/photos/chat/")
        # Extension should be added
        assert "." in media_path.split("/")[-1]


class TestDeleteMediaFile:
    """Tests for deleting media files."""
    
    @pytest.mark.asyncio
    async def test_delete_existing_file(self, temp_media_root, sample_image_file):
        """Test deleting an existing media file."""
        from media_handling.service import save_media_file, delete_media_file, get_full_file_path
        upload_file = UploadFile(file=sample_image_file, filename="test.jpg")
        media_path = await save_media_file(upload_file, context="chat")
        
        # Verify file exists
        full_path = get_full_file_path(media_path)
        assert os.path.exists(full_path)
        
        # Delete file
        result = delete_media_file(media_path)
        
        # Verify deletion
        assert result is True
        assert not os.path.exists(full_path)
    
    def test_delete_nonexistent_file(self, temp_media_root):
        """Test deleting a non-existent file returns False."""
        from media_handling.service import delete_media_file
        result = delete_media_file("/media/photos/chat/nonexistent.jpg")
        assert result is False
    
    def test_delete_invalid_path(self, temp_media_root):
        """Test deleting with invalid path format returns False."""
        from media_handling.service import delete_media_file
        result = delete_media_file("invalid/path")
        assert result is False
        
        result = delete_media_file(None)
        assert result is False


class TestGetFullFilePath:
    """Tests for getting full file paths."""
    
    @pytest.mark.asyncio
    async def test_get_full_path_existing_file(self, temp_media_root, sample_image_file):
        """Test getting full path for existing file."""
        from media_handling.service import save_media_file, get_full_file_path
        upload_file = UploadFile(file=sample_image_file, filename="test.jpg")
        media_path = await save_media_file(upload_file, context="chat")
        
        full_path = get_full_file_path(media_path)
        
        assert full_path is not None
        assert os.path.exists(full_path)
        assert full_path.startswith(temp_media_root)
    
    def test_get_full_path_nonexistent_file(self, temp_media_root):
        """Test getting full path for non-existent file returns None."""
        from media_handling.service import get_full_file_path
        full_path = get_full_file_path("/media/photos/chat/nonexistent.jpg")
        assert full_path is None
    
    def test_get_full_path_invalid_format(self, temp_media_root):
        """Test getting full path with invalid format returns None."""
        from media_handling.service import get_full_file_path
        assert get_full_file_path("invalid/path") is None
        assert get_full_file_path(None) is None
        assert get_full_file_path("") is None


class TestChatMediaIntegration:
    """Integration tests for chat media upload."""
    
    @pytest.mark.asyncio
    async def test_chat_media_upload_flow(self, temp_media_root, sample_image_file):
        """Test complete flow of chat media upload."""
        from media_handling.service import save_media_file, get_full_file_path
        # Simulate upload
        upload_file = UploadFile(file=sample_image_file, filename="chat_image.jpg")
        media_path = await save_media_file(upload_file, context="chat")
        
        # Verify path format
        assert media_path.startswith("/media/photos/chat/")
        
        # Verify file is accessible
        full_path = get_full_file_path(media_path)
        assert full_path is not None
        assert os.path.exists(full_path)
        
        # Verify file can be read
        with open(full_path, "rb") as f:
            content = f.read()
            assert content == b"fake image content"
    
    @pytest.mark.asyncio
    async def test_multiple_uploads_unique_paths(self, temp_media_root, sample_image_file):
        """Test that multiple uploads generate unique paths."""
        from media_handling.service import save_media_file, get_full_file_path
        paths = []
        
        for i in range(3):
            file = BytesIO(b"content " + str(i).encode())
            file.name = f"test_{i}.jpg"
            upload_file = UploadFile(file=file, filename=f"test_{i}.jpg")
            media_path = await save_media_file(upload_file, context="chat")
            paths.append(media_path)
        
        # All paths should be unique
        assert len(set(paths)) == 3
        
        # All files should exist
        for path in paths:
            full_path = get_full_file_path(path)
            assert full_path is not None
            assert os.path.exists(full_path)

