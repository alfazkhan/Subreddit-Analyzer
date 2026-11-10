-- Composite B-Tree index for global cursor pagination
CREATE INDEX IF NOT EXISTS idx_reddit_posts_cursor 
ON reddit_posts (timestamp DESC, id DESC);

-- Composite B-Tree index for subreddit-filtered cursor pagination
CREATE INDEX IF NOT EXISTS idx_reddit_posts_sub_cursor 
ON reddit_posts (subreddit_id, timestamp DESC, id DESC);