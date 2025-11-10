-- Migration: Add search indexes on users table
-- Description: Adds indexes on first_name, last_name, and composite index for efficient name-based searches
-- Date: 2025-11-08
-- 
-- This migration is idempotent - it will not fail if indexes already exist
-- Run this on both dev and prod databases
--
-- PERFORMANCE NOTE:
-- These indexes help with exact matches and prefix searches, but LIKE queries with
-- leading wildcards (e.g., '%name%') won't use indexes efficiently. For better
-- performance at scale, consider:
--   - MySQL FULLTEXT indexes for text search
--   - Search engines (Elasticsearch, etc.) for large datasets
--   - Prefix-only matching (no leading %) when possible

-- Add index on first_name for LIKE queries
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);

-- Add index on last_name for LIKE queries
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

-- Add composite index on (first_name, last_name) for full name searches
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(first_name, last_name);

-- Verify indexes were created
-- Run this after migration: SHOW INDEXES FROM users WHERE Key_name LIKE 'idx_users%';

