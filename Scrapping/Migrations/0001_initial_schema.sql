CREATE TABLE IF NOT EXISTS subreddits (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    total_users INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_gap_scan TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS scraping_queue (
    post_id TEXT PRIMARY KEY,
    subreddit TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reddit_posts (
    id VARCHAR(20) PRIMARY KEY,
    timestamp TIMESTAMP WITHOUT TIME ZONE,
    title TEXT,
    body TEXT,
    sentiment VARCHAR(20),
    keywords JSONB,
    entities JSONB,
    subreddit_id INTEGER REFERENCES subreddits(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ignored_words (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL,
    subreddit_id INTEGER REFERENCES subreddits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scraping_queue_status ON scraping_queue(status);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_sub_id_ts ON reddit_posts(subreddit_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_subreddits_name ON subreddits(name);