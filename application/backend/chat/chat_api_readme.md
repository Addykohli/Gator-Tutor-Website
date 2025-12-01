# Chat API Documentation
Located in backend/chat/routers/chat_router.py

## **POST /api/chat/send**

Send a **text** or **media** message between two users.

### Request Body (JSON)
**Text-only example:**
```json
{
  "sender_id": 1,
  "receiver_id": 2,
  "content": "Test message."
}
```
### Response (201 Created)
```json
{
  "message_id": 45,
  "sender_id": 1,
  "receiver_id": 2,
  "content": "Hello!",
  "media_url": null,
  "created_at": "2025-11-07T19:35:21"
}
```
## **GET /api/chat/chatroomhistory/{user1_id}/{user2_id}**
Entire chat history between 2 users, oldest to newest based on message_id
### Request 
GET /api/chat/chatroomhistory/1/2

### Response (200)
```json
[
  {
    "message_id": 45,
    "sender_id": 1,
    "receiver_id": 2,
    "content": "Hello!",
    "media_path": null,
    "created_at": "2025-11-07T19:35:21"
  },
  {
    "message_id": 1,
    "sender_id": 2,
    "receiver_id": 1,
    "content": null,
    "media_path": "https://someurl.com/assets/image1.png",
    "media_type":"image",
    "created_at": "2025-11-07T19:37:10"
  }
]
```

## **GET /api/chat/allchats/{user_id}**
Returns list of different userIDs that the current user has messages/chats with. Each user can only have one chatroom with another user, so different userID's = differnt chatrooms.
### Request 
GET /api/chat/allchats/1

### Response (200)
```json
[2, 5, 8]
```