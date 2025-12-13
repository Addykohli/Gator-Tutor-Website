"""
Unit tests for chat read flag functionality.
"""
import pytest
from sqlalchemy.orm import Session
from search.models.user import User
from chat.models.chat_message import ChatMessage
from chat.services.chat_service import send_message, get_chat
from chat.schemas.chat_schemas import MessageInfo
from chat.routers.chat_router import mark_message_read, mark_conversation_read
from fastapi import HTTPException


def test_create_message_is_unread_by_default(test_db: Session, test_user_a: User, test_user_b: User):
    """Test: Create message from user_a to user_b and verify is_read is False by default."""
    message_info = MessageInfo(
        receiver_id=test_user_b.user_id,
        content="Test message"
    )
    
    message = send_message(test_db, test_user_a.user_id, message_info)
    
    # Verify message exists and is_read is False
    assert message is not None
    assert message.is_read == False
    assert message.sender_id == test_user_a.user_id
    assert message.receiver_id == test_user_b.user_id


def test_mark_message_read(test_db: Session, test_user_a: User, test_user_b: User):
    """Test: Call mark_message_read endpoint and verify is_read is True."""
    # Create message
    message_info = MessageInfo(
        receiver_id=test_user_b.user_id,
        content="Test message"
    )
    message = send_message(test_db, test_user_a.user_id, message_info)
    
    # Verify initially unread
    assert message.is_read == False
    
    # Mark as read
    result = mark_message_read(message.message_id, test_db)
    
    # Verify response
    assert result["success"] == True
    assert result["message_id"] == message.message_id
    assert result["is_read"] == True
    
    # Refresh and verify in database
    test_db.refresh(message)
    assert message.is_read == True


def test_mark_message_read_toggle_multiple_times(test_db: Session, test_user_a: User, test_user_b: User):
    """Test: Toggle message read/unread multiple times."""
    # Create message
    message_info = MessageInfo(
        receiver_id=test_user_b.user_id,
        content="Test message"
    )
    message = send_message(test_db, test_user_a.user_id, message_info)
    
    # Mark as read (first time)
    result1 = mark_message_read(message.message_id, test_db)
    assert result1["is_read"] == True
    test_db.refresh(message)
    assert message.is_read == True
    
    # Mark as read again (should still be True)
    result2 = mark_message_read(message.message_id, test_db)
    assert result2["is_read"] == True
    test_db.refresh(message)
    assert message.is_read == True


def test_bulk_mark_conversation_read(test_db: Session, test_user_a: User, test_user_b: User):
    """Test: Create multiple messages and call bulk mark_read endpoint."""
    # Create multiple messages from user_a to user_b
    messages = []
    for i in range(3):
        message_info = MessageInfo(
            receiver_id=test_user_b.user_id,
            content=f"Test message {i+1}"
        )
        message = send_message(test_db, test_user_a.user_id, message_info)
        messages.append(message)
        # Verify all are unread
        assert message.is_read == False
    
    # Mark all as read
    result = mark_conversation_read(test_user_b.user_id, test_user_a.user_id, test_db)
    
    # Verify response
    assert result["success"] == True
    assert result["messages_marked_read"] == 3
    
    # Verify all messages are marked as read
    for msg in messages:
        test_db.refresh(msg)
        assert msg.is_read == True


def test_get_chat_includes_is_read(test_db: Session, test_user_a: User, test_user_b: User):
    """Test: Verify is_read appears in get_chat() response."""
    # Create message
    message_info = MessageInfo(
        receiver_id=test_user_b.user_id,
        content="Test message"
    )
    message = send_message(test_db, test_user_a.user_id, message_info)
    
    # Get chat
    chat_messages = get_chat(test_db, test_user_a.user_id, test_user_b.user_id)
    
    # Verify is_read is in response
    assert len(chat_messages) == 1
    assert "is_read" in chat_messages[0]
    assert chat_messages[0]["is_read"] == False
    assert chat_messages[0]["message_id"] == message.message_id
    
    # Mark as read and verify again
    mark_message_read(message.message_id, test_db)
    chat_messages = get_chat(test_db, test_user_a.user_id, test_user_b.user_id)
    assert chat_messages[0]["is_read"] == True


def test_mark_nonexistent_message_read(test_db: Session):
    """Test: Verify marking non-existent message raises 404."""
    with pytest.raises(HTTPException) as exc_info:
        mark_message_read(99999, test_db)
    assert exc_info.value.status_code == 404


def test_bulk_mark_read_only_affects_unread_messages(test_db: Session, test_user_a: User, test_user_b: User):
    """Test: Bulk mark_read only affects unread messages."""
    # Create 3 messages
    messages = []
    for i in range(3):
        message_info = MessageInfo(
            receiver_id=test_user_b.user_id,
            content=f"Test message {i+1}"
        )
        message = send_message(test_db, test_user_a.user_id, message_info)
        messages.append(message)
    
    # Mark first message as read manually
    mark_message_read(messages[0].message_id, test_db)
    
    # Bulk mark all as read
    result = mark_conversation_read(test_user_b.user_id, test_user_a.user_id, test_db)
    
    # Should only mark 2 messages (the unread ones)
    assert result["messages_marked_read"] == 2
    
    # But all should be read now
    for msg in messages:
        test_db.refresh(msg)
        assert msg.is_read == True

