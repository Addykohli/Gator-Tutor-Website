from chat.models.chat_message import ChatMessage
from chat.models.chat_media import ChatMedia
from chat.schemas.chat_schemas import MessageInfo
from sqlalchemy.orm import Session
from datetime import datetime

def send_message(db: Session, sender_id: int, req: MessageInfo):
    if isinstance(req, dict):
        req = MessageInfo(**req)
        
    chat_message = ChatMessage(
        sender_id=sender_id,
        receiver_id=req.receiver_id,
        content=req.content
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    return chat_message

def send_message_with_media(db: Session, sender_id: int, receiver_id: int, content: str, file_path: str, file_type: str):
    chat_message = ChatMessage(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    
    chat_media = ChatMedia(
        message_id=chat_message.message_id,
        media_path=file_path,
        media_type=file_type
    )
    db.add(chat_media)
    db.commit()
    db.refresh(chat_media)
    
    return chat_message, chat_media

def get_chat(db: Session, user1: int, user2: int):
    messages = (
        db.query(ChatMessage)
        .filter(
            ((ChatMessage.sender_id == user1) & (ChatMessage.receiver_id == user2)) |
            ((ChatMessage.sender_id == user2) & (ChatMessage.receiver_id == user1))
        ).order_by(ChatMessage.created_at.asc()).all()
    )
    
    result = []
    for msg in messages:
        media = db.query(ChatMedia).filter(ChatMedia.message_id == msg.message_id).first()
        result.append({
            "message_id": msg.message_id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "content": msg.content,
            "media_path": media.media_path if media else None,
            "media_type": media.media_type if media else None,
            "created_at": msg.created_at,
            "is_read": msg.is_read
        })
    return result

def get_user_chats(db: Session, user_id: int):
    related_messages = (
        db.query(ChatMessage).filter(
            (ChatMessage.sender_id == user_id) | (ChatMessage.receiver_id == user_id)
        ).all()
    )
    other_users = set()
    for message in related_messages:
        if message.sender_id == user_id:
            other_users.add(message.receiver_id)
        else:
            other_users.add(message.sender_id)
    return list(other_users)