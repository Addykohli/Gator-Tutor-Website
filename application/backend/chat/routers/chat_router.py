from chat.schemas.chat_schemas import MessageInfo, MessageResponse
from chat.services.chat_service import send_message, get_chat, get_user_chats
from auth.services.auth_service import get_user_by_id
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from fastapi import WebSocket, WebSocketDisconnect
from chat.services.connection_manager import manager


from search.database import get_db

router = APIRouter(prefix="/api/chat", tags=["chat"])
#send endpoint
@router.post("/send", response_model=MessageResponse)
def send_endpoint(req:MessageInfo, db: Session = Depends(get_db), user_id:int = None):
    if user_id is None:
        raise HTTPException(status_code =400, detail =" user_is not found")

    sender = get_user_by_id(db, user_id)
    if not sender:
        raise HTTPException(status_code = 404, detail="sender id not found")
    
    message = send_message(db, user_id, req)
    return message

#chat endpoints for all chat messages between current 2 users
@router.get("/chatroomhistory/{user1}/{user2}", response_model = list[MessageResponse])
def get_chat_endpoint(user1:int, user2:int, db: Session = Depends(get_db)):
    messages = get_chat(db, user1, user2)
    return messages

#get all chats one user is in(ie all messages associated with user)
@router.get("/allchats/{user_id}", response_model=list[int])
def get_user_chats_endpoint(user_id:int, db: Session = Depends(get_db)):
    related_chats = get_user_chats(db, user_id)
    return related_chats

#adding the websocket to have realtime chat(ie user sends message and 
# it is sent/recieved wihout having to reload page)
# while it is also still storing them in the db
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id= data["receiver_id"]
            content = data["content"]
            db = next(get_db())
            chat_message = send_message(db =db, sender_id=user_id, req=data)

            await manager.broadcast_to_pair(
                user1=user_id,
                user2=receiver_id,
                message={
                    "message_id":chat_message.message_id,
                    "sender_id": user_id,
                    "receiver_id":receiver_id,
                    "content": content,
                    "created_at": str(chat_message.created_at)
                }
            )

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

