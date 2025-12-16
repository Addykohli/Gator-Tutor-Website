"""
Pydantic schemas for chat responses.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageInfo(BaseModel):
    receiver_id: int
    content: str

class MediaMessageInfo(BaseModel):
    receiver_id: int
    content: Optional[str] = None

class MessageResponse(BaseModel):
    message_id: int
    sender_id: int
    receiver_id: int
    content: str | None
    media_path: str | None = None
    media_type: str | None = None
    created_at: datetime
    is_read: bool = False