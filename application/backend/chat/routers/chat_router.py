from chat.schemas.chat_schemas import MessageInfo, MessageResponse
from chat.services.chat_service import send_message, send_message_with_media, get_chat, get_user_chats
from chat.models.chat_message import ChatMessage
from auth.services.auth_service import get_user_by_id
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from fastapi import WebSocket, WebSocketDisconnect
from chat.services.connection_manager import manager
from search.database import get_db
from media_handling.service import save_media_file
from typing import Optional

router = APIRouter(prefix="/api/chat", tags=["chat"])

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
    
    # Save file using media service (saves to /home/atharva/media/ and returns /media/... path)
    media_path = await save_media_file(file, context="chat")
    
    message, media = send_message_with_media(
        db, user_id, receiver_id, content or "", media_path, file.content_type
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

        