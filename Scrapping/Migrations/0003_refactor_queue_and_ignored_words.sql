-- 1. Alter scraping_queue table to introduce foreign key column mapping
ALTER TABLE scraping_queue ADD COLUMN subreddit_id INTEGER REFERENCES subreddits(id) ON DELETE CASCADE;

-- 2. Backfill existing queue records by matching raw text names to unique relational entries
UPDATE scraping_queue q
SET subreddit_id = s.id
FROM subreddits s
WHERE q.subreddit = s.name;

-- 3. Drop old text-based identifier column from scraping_queue
ALTER TABLE scraping_queue DROP COLUMN subreddit;

-- 4. Enforce strict relational integrity constraints on the fresh foreign key identifier
ALTER TABLE scraping_queue ALTER COLUMN subreddit_id SET NOT NULL;

-- 5. Re-align system indexing configurations for optimized lookup metrics
DROP INDEX IF EXISTS idx_scraping_queue_status;
CREATE INDEX idx_scraping_queue_sub_id_status ON scraping_queue(subreddit_id, status);

-- 6. Remove subreddit_id from ignored_words to switch it to a global rule system
ALTER TABLE ignored_words DROP COLUMN IF EXISTS subreddit_id;