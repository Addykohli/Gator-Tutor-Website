"""
Chat Message model representing individual messages of the chat.
"""
from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, Index
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

"""
SenderID, Reciever ID, conversationid/chatid, 
sent At(?), recieved at(?)- not sure if necessary

if media is involved , point to chatmedia model
should point to chat id
Note: ConversationID or every chat is just determined by sender/reciever combo(?)
"""
class ChatMessage(Base):
    __tablename__ ="chat_messages"

    message_id = Column(Integer, primary_key=True, Index=True)
    sender_id = Column(Integer, ForeignKey("users.user_id"))
    reciever_id = Column(Integer, ForeignKey("users.user_id"))
    content = Column(Text, nullable =True)
    created_at = Column(DataTime, default = datatime.utcnow)

    #point to chatmedia model
    chat_media = relationship("ChatMedia", back_populates="message")