-- Migration: Add is_deleted flag to users table
ALTER TABLE users ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

