"""
Chat Media model representing media sent in the chat.
"""
from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from search.database import Base
from datetime import datetime
"""
SenderID, Reciever ID, conversationid/chatid fk, mediaid PK
-similar to chat
point to chat message
media path
media type(pictures, docs?)
"""
class ChatMedia(Base):
    __tablename__ ="chat_media"

    media_id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("chat_messages.message_id"))
    media_path = Column(String(500), nullable=True)
    media_type = Column(String(500), nullable=True)
    created_at = Column(DateTime, default = datetime.utcnow)

    #point to chat_message model
    message = relationship("ChatMessage", back_populates="chat_media")