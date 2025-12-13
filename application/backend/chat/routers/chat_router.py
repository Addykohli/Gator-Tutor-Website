from chat.schemas.chat_schemas import MessageInfo, MediaMessageInfo, MessageResponse
from chat.services.chat_service import send_message, send_message_with_media, get_chat, get_user_chats
from chat.models.chat_message import ChatMessage
from auth.services.auth_service import get_user_by_id
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from fastapi import WebSocket, WebSocketDisconnect
from chat.services.connection_manager import manager
from search.database import get_db
import os
import uuid
from typing import Optional

router = APIRouter(prefix="/api/chat", tags=["chat"])

UPLOAD_DIR = "uploads/chat_media"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/send", response_model=MessageResponse)
def send_endpoint(req: MessageInfo, db: Session = Depends(get_db), user_id: int = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="user_id not found")

    sender = get_user_by_id(db, user_id)
    if not sender:
        raise HTTPException(status_code=404, detail="sender id not found")
    
    message = send_message(db, user_id, req)
    return MessageResponse(
        message_id=message.message_id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        media_path=None,
        media_type=None,
        created_at=message.created_at,
        is_read=message.is_read
    )

@router.patch("/messages/{message_id}/read")
def mark_message_read(message_id: int, db: Session = Depends(get_db)):
    """Mark a single message as read"""
    msg = db.query(ChatMessage).filter(ChatMessage.message_id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    return {"success": True, "message_id": message_id, "is_read": True}

@router.patch("/messages/mark-read")
def mark_conversation_read(receiver_id: int, sender_id: int, db: Session = Depends(get_db)):
    """Mark all messages in a conversation as read"""
    updated = db.query(ChatMessage).filter(
        ChatMessage.receiver_id == receiver_id,
        ChatMessage.sender_id == sender_id,
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"success": True, "messages_marked_read": updated}

@router.post("/send-media", response_model=MessageResponse)
async def send_media_endpoint(
    file: UploadFile = File(...),
    receiver_id: int = Form(...),
    content: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user_id: int = None
):
    if user_id is None:
        raise HTTPException(status_code=400, detail="user_id not found")

    sender = get_user_by_id(db, user_id)
    if not sender:
        raise HTTPException(status_code=404, detail="sender id not found")
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        file_content = await file.read()
        f.write(file_content)
    
    media_url = f"/api/chat/media/{unique_filename}"
    
    message, media = send_message_with_media(
        db, user_id, receiver_id, content or "", media_url, file.content_type
    )
    
    return MessageResponse(
        message_id=message.message_id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        media_path=media.media_path,
        media_type=media.media_type,
        created_at=message.created_at,
        is_read=message.is_read
    )

@router.get("/media/{filename}")
async def get_media(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@router.get("/chatroomhistory/{user1}/{user2}")
def get_chat_endpoint(user1: int, user2: int, db: Session = Depends(get_db)):
    messages = get_chat(db, user1, user2)
    return messages

@router.get("/allchats/{user_id}", response_model=list[int])
def get_user_chats_endpoint(user_id: int, db: Session = Depends(get_db)):
    related_chats = get_user_chats(db, user_id)
    return related_chats

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data["receiver_id"]
            content = data["content"]
            db = next(get_db())
            chat_message = send_message(db=db, sender_id=user_id, req=data)

            await manager.broadcast_to_pair(
                user1=user_id,
                user2=receiver_id,
                message={
                    "message_id": chat_message.message_id,
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "media_path": None,
                    "media_type": None,
                    "created_at": str(chat_message.created_at)
                }
            )

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

        