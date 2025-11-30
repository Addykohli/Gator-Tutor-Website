"""
Pydantic schemas for chat responses.
"""
from pydantic import BaseModel
from datetime import datetime

class MessageInfo(BaseModel):
    receiver_id: int
    content: str | None =None

class MessageResponse(BaseModel):
    message_id: int
    sender_id: int
    receiver_id: int
    content: str | None
    created_at: datetime
