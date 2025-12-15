-- Migration: Add is_read flag to chat_messages table
ALTER TABLE chat_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX idx_chat_messages_is_read ON chat_messages(receiver_id, is_read);

