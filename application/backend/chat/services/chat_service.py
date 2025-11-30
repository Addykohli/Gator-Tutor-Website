from chat.models.chat_message import ChatMessage
from sqlalchemy.orm import Session

def send_message(db: Session, sender_id: int, data):
    chat_message = ChatMessage(
        sender_id = sender_id,
        reciever_id = data.reciever_id,
        content=data.content
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    return chat_message
#convos determined by the 2 users conntected to messages, meaning 2 users cant have diff chat
def get_conversation(db:Session, user1:int, user2:int):
    return(
        db.query(ChatMessage)
        .filter(
            ( (ChatMessage.sender_id == user1)&(ChatMessage.reciever_id ==user2) ) |
            ( (ChatMessage.sender_id == user2)&(ChatMessage.reciever_id ==user1) )
        ).order_by(ChatMessage.created_at.asc()).all()
    )