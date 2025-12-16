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

## Websocket for realtime messaging##
### /ws/chat/{user_id}
Opens a WebSocket connection for a user.Broadcasts to both users.
when connecting the server will also store the WebSocket in manger.active_connections[user_id]

## Chat Message Read/Unread Functionality

The chat system includes read/unread tracking for messages. Messages are marked as unread by default and can be marked as read by the receiver.

### PATCH /api/chat/messages/{message_id}/read

Mark a single message as read.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message_id` | integer | Yes | The ID of the message to mark as read |

#### Request Example

```bash
PATCH /api/chat/messages/45/read
```

#### Response (200 OK)

```json
{
  "success": true,
  "message_id": 45,
  "is_read": true
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the operation was successful |
| `message_id` | integer | ID of the message that was marked as read |
| `is_read` | boolean | Confirms the message is now marked as read |

#### Error Responses

**404 Not Found**

Message with the specified ID does not exist.

```json
{
  "detail": "Message not found"
}
```

### PATCH /api/chat/messages/mark-read

Mark all unread messages in a conversation as read. This is useful for marking an entire conversation as read when a user opens it.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `receiver_id` | integer | Yes | The ID of the user who received the messages (the one marking them as read) |
| `sender_id` | integer | Yes | The ID of the user who sent the messages |

#### Request Example

```bash
PATCH /api/chat/messages/mark-read?receiver_id=2&sender_id=1
```

#### Response (200 OK)

```json
{
  "success": true,
  "messages_marked_read": 5
}
```

**Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the operation was successful |
| `messages_marked_read` | integer | Number of messages that were marked as read (only counts previously unread messages) |

**Note**: This endpoint only marks unread messages as read. If a message is already read, it is not counted in `messages_marked_read`.

### Message Read Status in Responses

All chat message responses now include an `is_read` field:

#### GET /api/chat/chatroomhistory/{user1_id}/{user2_id}

The chat history response includes `is_read` for each message:

```json
[
  {
    "message_id": 45,
    "sender_id": 1,
    "receiver_id": 2,
    "content": "Hello!",
    "media_path": null,
    "media_type": null,
    "created_at": "2025-11-07T19:35:21",
    "is_read": false
  },
  {
    "message_id": 46,
    "sender_id": 1,
    "receiver_id": 2,
    "content": "How are you?",
    "media_path": null,
    "media_type": null,
    "created_at": "2025-11-07T19:36:10",
    "is_read": true
  }
]
```

#### POST /api/chat/send

The send message response also includes `is_read`:

```json
{
  "message_id": 47,
  "sender_id": 1,
  "receiver_id": 2,
  "content": "New message",
  "media_path": null,
  "media_type": null,
  "created_at": "2025-11-07T19:37:00",
  "is_read": false
}
```

### How Read Status Works

1. **Default State**: All new messages are created with `is_read = false`
2. **Marking as Read**: The receiver can mark messages as read using the endpoints above
3. **Idempotency**: Marking a message as read multiple times is safe and doesn't cause errors
4. **Bulk Operations**: The bulk mark-read endpoint only affects unread messages, making it safe to call multiple times

### Database Schema

The `chat_messages` table includes an `is_read` boolean field:

```sql
ALTER TABLE chat_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX idx_chat_messages_is_read ON chat_messages(receiver_id, is_read);
```

### Frontend Integration

The frontend should:

1. Display unread message indicators when `is_read = false`
2. Call `PATCH /api/chat/messages/{message_id}/read` when a user clicks on a message
3. Call `PATCH /api/chat/messages/mark-read` when a user opens a conversation to mark all messages as read
4. Use the `is_read` field from message responses to show read/unread status

### Use Cases

#### Mark Single Message as Read

When a user clicks on a specific message:

```bash
PATCH /api/chat/messages/45/read
```

#### Mark Entire Conversation as Read

When a user opens a conversation:

```bash
PATCH /api/chat/messages/mark-read?receiver_id=2&sender_id=1
```

This will mark all unread messages from user 1 to user 2 as read.

### Testing

Unit tests for this functionality are located in:
- `tests/test_chat_read_flag.py`

Run tests with:
```bash
cd application/backend
uv run pytest tests/test_chat_read_flag.py -v
```

**Possible Errors**
- 404 Not Found: Message not found (for single message endpoint)

