-- Migration: Add GIN index for fast keyword containment lookups and purges
CREATE INDEX IF NOT EXISTS idx_reddit_posts_keywords_gin 
ON reddit_posts USING gin ((keywords::jsonb));