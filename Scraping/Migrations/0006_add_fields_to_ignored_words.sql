-- Up migration: Add metadata and control flags to ignored_words table

ALTER TABLE ignored_words 
ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;