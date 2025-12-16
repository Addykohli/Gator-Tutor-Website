"""
Integration tests for chat media API endpoints.

Tests cover:
- Media upload via /api/chat/send-media endpoint
- Media path storage in database
- Media retrieval in chat messages
"""

import pytest
import os
import tempfile
import shutil
from fastapi.testclient import TestClient
from io import BytesIO

from main import app


@pytest.fixture
def temp_media_root():
    """Create a temporary media root directory for testing."""
    temp_dir = tempfile.mkdtemp()
    original_media_root = os.environ.get("MEDIA_ROOT")
    os.environ["MEDIA_ROOT"] = temp_dir
    
    # Patch the MEDIA_ROOT in the service module
    import media_handling.service
    original_media_root_attr = media_handling.service.MEDIA_ROOT
    media_handling.service.MEDIA_ROOT = temp_dir
    
    yield temp_dir
    
    # Restore
    media_handling.service.MEDIA_ROOT = original_media_root_attr
    if original_media_root:
        os.environ["MEDIA_ROOT"] = original_media_root
    elif "MEDIA_ROOT" in os.environ:
        del os.environ["MEDIA_ROOT"]
    
    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def client(test_db, temp_media_root):
    """Create a test client with database dependency override."""
    from search.database import get_db
    
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


class TestChatMediaUpload:
    """Tests for chat media upload endpoint."""
    
    def test_upload_image_file(self, client, test_user_a, test_user_b, temp_media_root):
        """Test uploading an image file via chat media endpoint."""
        # Create test image file
        file_content = b"fake image content"
        files = {
            "file": ("test_image.jpg", BytesIO(file_content), "image/jpeg")
        }
        data = {
            "receiver_id": test_user_b.user_id,
            "content": "Check out this image!"
        }
        
        response = client.post(
            f"/api/chat/send-media?user_id={test_user_a.user_id}",
            files=files,
            data=data
        )
        
        assert response.status_code == 200
        response_data = response.json()
        
        # Verify response structure
        assert "message_id" in response_data
        assert "media_path" in response_data
        assert "media_type" in response_data
        
        # Verify media path format
        media_path = response_data["media_path"]
        assert media_path.startswith("/media/photos/chat/")
        assert media_path.endswith(".jpg")
        
        # Verify media type
        assert response_data["media_type"] == "image/jpeg"
    
    def test_upload_pdf_file(self, client, test_user_a, test_user_b, temp_media_root):
        """Test uploading a PDF file via chat media endpoint."""
        file_content = b"%PDF-1.4 fake pdf content"
        files = {
            "file": ("test_document.pdf", BytesIO(file_content), "application/pdf")
        }
        data = {
            "receiver_id": test_user_b.user_id,
            "content": "Here's a document"
        }
        
        response = client.post(
            f"/api/chat/send-media?user_id={test_user_a.user_id}",
            files=files,
            data=data
        )
        
        assert response.status_code == 200
        response_data = response.json()
        
        # Verify PDF is categorized correctly
        media_path = response_data["media_path"]
        assert media_path.startswith("/media/pdfs/chat/")
        assert media_path.endswith(".pdf")
    
    def test_upload_video_file(self, client, test_user_a, test_user_b, temp_media_root):
        """Test uploading a video file via chat media endpoint."""
        file_content = b"fake video content"
        files = {
            "file": ("test_video.mp4", BytesIO(file_content), "video/mp4")
        }
        data = {
            "receiver_id": test_user_b.user_id,
            "content": "Check out this video"
        }
        
        response = client.post(
            f"/api/chat/send-media?user_id={test_user_a.user_id}",
            files=files,
            data=data
        )
        
        assert response.status_code == 200
        response_data = response.json()
        
        # Verify video is categorized correctly
        media_path = response_data["media_path"]
        assert media_path.startswith("/media/videos/chat/")
        assert media_path.endswith(".mp4")
    
    def test_upload_without_user_id(self, client, test_user_b, temp_media_root):
        """Test that upload fails without user_id."""
        file_content = b"fake content"
        files = {
            "file": ("test.jpg", BytesIO(file_content), "image/jpeg")
        }
        data = {
            "receiver_id": test_user_b.user_id
        }
        
        response = client.post(
            "/api/chat/send-media",
            files=files,
            data=data
        )
        
        assert response.status_code == 400
    
    def test_upload_without_receiver_id(self, client, test_user_a, temp_media_root):
        """Test that upload fails without receiver_id."""
        file_content = b"fake content"
        files = {
            "file": ("test.jpg", BytesIO(file_content), "image/jpeg")
        }
        
        response = client.post(
            f"/api/chat/send-media?user_id={test_user_a.user_id}",
            files=files
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_upload_creates_chat_message(self, client, test_user_a, test_user_b, test_db, temp_media_root):
        """Test that upload creates both chat message and chat media records."""
        from chat.models.chat_message import ChatMessage
        from chat.models.chat_media import ChatMedia
        
        file_content = b"fake image content"
        files = {
            "file": ("test.jpg", BytesIO(file_content), "image/jpeg")
        }
        data = {
            "receiver_id": test_user_b.user_id,
            "content": "Test message"
        }
        
        response = client.post(
            f"/api/chat/send-media?user_id={test_user_a.user_id}",
            files=files,
            data=data
        )
        
        assert response.status_code == 200
        response_data = response.json()
        message_id = response_data["message_id"]
        
        # Verify chat message was created
        message = test_db.query(ChatMessage).filter(ChatMessage.message_id == message_id).first()
        assert message is not None
        assert message.sender_id == test_user_a.user_id
        assert message.receiver_id == test_user_b.user_id
        assert message.content == "Test message"
        
        # Verify chat media was created
        media = test_db.query(ChatMedia).filter(ChatMedia.message_id == message_id).first()
        assert media is not None
        assert media.media_path.startswith("/media/photos/chat/")
        assert media.media_type == "image/jpeg"


class TestChatMediaRetrieval:
    """Tests for retrieving media in chat messages."""
    
    def test_get_chat_includes_media_path(self, client, test_user_a, test_user_b, test_db, temp_media_root):
        """Test that get_chat includes media_path in response."""
        from chat.services.chat_service import send_message_with_media
        
        # Create a message with media
        file_content = b"fake content"
        files = {
            "file": ("test.jpg", BytesIO(file_content), "image/jpeg")
        }
        data = {
            "receiver_id": test_user_b.user_id,
            "content": "Message with media"
        }
        
        upload_response = client.post(
            f"/api/chat/send-media?user_id={test_user_a.user_id}",
            files=files,
            data=data
        )
        assert upload_response.status_code == 200
        
        # Get chat history
        response = client.get(
            f"/api/chat/chatroomhistory/{test_user_a.user_id}/{test_user_b.user_id}"
        )
        
        assert response.status_code == 200
        messages = response.json()
        
        # Find the message with media
        media_message = next((m for m in messages if m.get("media_path")), None)
        assert media_message is not None
        assert media_message["media_path"].startswith("/media/photos/chat/")
        assert media_message["media_type"] == "image/jpeg"

