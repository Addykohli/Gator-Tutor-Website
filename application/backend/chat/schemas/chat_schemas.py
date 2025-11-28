"""
Pydantic schemas for chat responses.
"""
from pydantic import BaseModel
from datetime import datetime

class MessageInfo(BaseModel):
    sender_id: int
    reciever_id: int
    content: str | None =None

class MessageResponse(BaseModel):
    message_id: int
    sender_id: int
    reciever_id: int
    content: str | None
    created_at: datetime
    