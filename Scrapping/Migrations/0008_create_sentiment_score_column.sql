BEGIN;

ALTER TABLE reddit_posts 
ADD COLUMN IF NOT EXISTS sentiment_scores JSONB DEFAULT NULL;

COMMENT ON COLUMN reddit_posts.sentiment_scores IS 'Stores sentiment score distribution e.g. {"positive": 0.82, "neutral": 0.12, "negative": 0.06}';

COMMIT;