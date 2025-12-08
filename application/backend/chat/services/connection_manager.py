from typing import Dict, List
from fastapi import WebSocket
"""
Connection Manager class from Fastapi Docs,
websocket endpoints in chat_router
"""

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]]= {}

    async def connect(self, user_id:int, websocket:WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id]=[]
        self.active_connections[user_id].append(websocket)
        
    def disconnect(self, user_id:int, websocket:WebSocket):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass

    async def send_personal_message(self, message:dict, user_id: int):
        if user_id in self.active_connections:
            for ws in self.active_connections[user_id]:
                try:
                    #needed for testing message being sent to both users
                    await ws.send_json(message)
                except Exception as e:
                    print(f"error sending to user {user_id}: {e}")
    #sends message to both users as soon as sent by 1
    async def broadcast_to_pair(self, user1:int, user2:int, message:dict):
        await self.send_personal_message(message, user1)
        await self.send_personal_message(message, user2)

manager= ConnectionManager()
