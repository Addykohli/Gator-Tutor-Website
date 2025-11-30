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
def get_chat(db:Session, user1:int, user2:int):
    return(
        db.query(ChatMessage)
        .filter(
            ( (ChatMessage.sender_id == user1)&(ChatMessage.reciever_id ==user2) ) |
            ( (ChatMessage.sender_id == user2)&(ChatMessage.reciever_id ==user1) )
        ).order_by(ChatMessage.created_at.asc()).all()
    )
#find all chats that individual user is involved in
def get_user_chats(db:Session, user_id:int):
    related_messages=(
        db.query(ChatMessage).filter( 
            (ChatMessage.sender_id ==user_id) | (ChatMessage.reciever_id == user_id) 
        ).all()
    )
    #other users to differentiate the chats
    other_users = set()
    for message in related_messages:
        if message.sender_id == user_id:
            other_users.add(message.reciever_id)
        else:
            other_users.add(message.sender_id)

    return list(other_users)