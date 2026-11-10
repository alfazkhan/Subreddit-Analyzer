-- Up migration: Add the topics JSONB column to our main tracking table
ALTER TABLE reddit_posts ADD COLUMN IF NOT EXISTS topics JSONB;

-- Performance Optimization: Create an index specifically for JSONB sub-keys 
-- This allows instant filtering on the 'primary_topic' value at scale
CREATE INDEX IF NOT EXISTS idx_posts_primary_topic ON reddit_posts USING gin ((topics->'primary_topic'));