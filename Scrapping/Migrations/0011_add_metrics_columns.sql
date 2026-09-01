-- 1. Add engagement metric columns to reddit_posts
ALTER TABLE reddit_posts 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS upvote_ratio NUMERIC(4, 3) DEFAULT 0.000,
ADD COLUMN IF NOT EXISTS num_comments INTEGER DEFAULT 0;