-- Migration 0013: Add timezone to subreddits and populate mappings
ALTER TABLE subreddits 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) DEFAULT 'UTC';

-- Populate city-specific timezones
UPDATE subreddits SET timezone = 'Europe/Berlin' WHERE LOWER(name) IN ('munich', 'berlin');
UPDATE subreddits SET timezone = 'America/New_York' WHERE LOWER(name) = 'nyc';
UPDATE subreddits SET timezone = 'Europe/London' WHERE LOWER(name) = 'london';
UPDATE subreddits SET timezone = 'Asia/Singapore' WHERE LOWER(name) = 'singapore';
UPDATE subreddits SET timezone = 'America/Los_Angeles' WHERE LOWER(name) = 'losangeles';
UPDATE subreddits SET timezone = 'Asia/Kolkata' WHERE LOWER(name) IN ('mumbai', 'delhi');
UPDATE subreddits SET timezone = 'Europe/Amsterdam' WHERE LOWER(name) = 'amsterdam';
UPDATE subreddits SET timezone = 'Europe/Paris' WHERE LOWER(name) = 'paris';
UPDATE subreddits SET timezone = 'Asia/Hong_Kong' WHERE LOWER(name) = 'hongkong';
UPDATE subreddits SET timezone = 'America/Toronto' WHERE LOWER(name) = 'toronto';
UPDATE subreddits SET timezone = 'UTC' WHERE LOWER(name) = 'reactjs';