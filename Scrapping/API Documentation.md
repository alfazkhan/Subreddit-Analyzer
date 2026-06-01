# The Only Alfaz City Analytics Engine - API Documentation

This document outlines all available endpoints, their expected request formats, and their response structures for the decoupled FastAPI backend.

---

## 1. Posts Endpoints (`/Routes/routes_posts.py`)

### `GET /summary`
Retrieves a high-level cache summary of all active subreddits, including post counts and the latest timestamp.
* **Request Body:** None
* **Response Format:** JSON Dictionary
```json
{
  "Munich": {
    "id": 1,
    "count": 1250,
    "last_updated": "2026-05-30T14:30:00"
  },
  "Barcelona": {
    "id": 2,
    "count": 843,
    "last_updated": "2026-05-31T09:15:22"
  }
}
```

### `GET /posts/{subreddit}`
Retrieves a paginated list of scraped posts for a specific subreddit, sorted by newest first.
* **Query Parameters:** `limit` (integer, default: 10, min: 1, max: 10000)
* **Request Body:** None
* **Response Format:** JSON Array of Post Objects
```json
[
  {
    "id": "t3_abc123",
    "subreddit_id": 1,
    "timestamp": "2026-05-31T10:00:00",
    "title": "Post Title",
    "body": "Post Body...",
    "sentiment": "Positive",
    "keywords": {"rent": 2, "apartment": 1},
    "entities": [{"text": "Munich", "label": "GPE"}],
    "topics": {
      "labels": ["Housing, Accommodations & Living Logistics"],
      "scores": [0.95],
      "primary_topic": "Housing, Accommodations & Living Logistics"
    },
    "subreddit_name": "Munich"
  }
]
```

### `GET /posts/{subreddit}/all`
Retrieves all scraped posts for a specific subreddit, sorted by newest first.
* **Request Body:** None
* **Response Format:** JSON Array of Post Objects (Same as above)

---

## 2. Subreddits Endpoints (`/Routes/routes_subreddits.py`)

### `GET /subreddits`
Retrieves all tracked subreddit configurations.
* **Request Body:** None
* **Response Format:** JSON Array
```json
[
  {
    "id": 1,
    "name": "Munich",
    "description": "City of Munich",
    "total_users": 150000,
    "is_active": true,
    "keep_updated": true
  }
]
```

### `GET /subreddits/{name}`
Retrieves tracking details for a single specific subreddit.
* **Request Body:** None
* **Response Format:** JSON Object (Single Subreddit Configuration)

### `POST /subreddits`
Registers a new subreddit for tracking and ingestion.
* **Request Body:** JSON Object
```json
{
  "name": "Berlin",
  "description": "Berlin City Discussions",
  "total_users": 200000,
  "is_active": true,
  "keep_updated": false
}
```
* **Response Format:** JSON Object
```json
{
  "id": 5,
  "message": "Tracking registry generated successfully"
}
```

### `PUT /subreddits/{name}`
Modifies the tracking configuration of an existing subreddit.
* **Request Body:** JSON Object (All fields are optional)
```json
{
  "is_active": false,
  "keep_updated": false
}
```
* **Response Format:** JSON Object
```json
{
  "message": "Tracking settings updated successfully"
}
```

### `DELETE /subreddits/{name}`
Permanently untracks and purges a subreddit from active indexing (does not delete associated posts).
* **Request Body:** None
* **Response Format:** JSON Object
```json
{
  "message": "Subreddit dropped out of active indexing tables successfully"
}
```

---

## 3. Ignored Words Endpoints (`/Routes/routes_ignored_words.py`)

### `GET /ignored-words`
Retrieves the complete list of ignored words available in the database.
* **Request Body:** None
* **Response Format:** JSON Array
```json
[
  {
    "word": "hello",
    "language": "en",
    "approved": true,
    "processed": true
  }
]
```

### `POST /ignored-words`
Adds a new array of ignored words to the database. Defaults to English and unapproved.
* **Request Body:** JSON Array of Objects
```json
[
  {
    "word": "testword",
    "language": "en",
    "approved": true
  },
  {
    "word": "hallo",
    "language": "de"
  }
]
```
* **Response Format:** JSON Object
```json
{
  "message": "2 ignored word(s) added successfully"
}
```

### `PUT /ignored-words/{word}`
Updates the metadata and control flags for a specific ignored word.
* **Request Body:** JSON Object (All fields are optional)
```json
{
  "language": "de",
  "approved": true,
  "processed": false
}
```
* **Response Format:** JSON Object
```json
{
  "message": "Ignored word updated successfully"
}
```

### `DELETE /ignored-words/{word}`
Permanently deletes a word from the ignored words list.
* **Request Body:** None
* **Response Format:** JSON Object
```json
{
  "message": "Ignored word deleted successfully"
}
```

---

## 4. Reanalysis Pipeline WebSocket (`/Routes/routes_reanalyze.py`)

### `WS /ws/reanalyze`
A real-time, bi-directional WebSocket connection for triggering and monitoring background deep-learning analytics (NLP).

#### **Client-to-Server Payloads (Actions)**

**Start Reanalysis:**
```json
{
  "action": "start",
  "pipelines": ["sentiment", "topic", "keywords", "entities"],
  "only_null": true,
  "subreddits": [1, 2, "Munich"], 
  "start_date": "2026-01-01", 
  "end_date": "2026-05-31"    
}
```
*(Note: `subreddits`, `start_date`, and `end_date` are optional)*

**Pause Reanalysis:**
```json
{"action": "pause"}
```

**Resume Reanalysis:**
```json
{"action": "resume"}
```

**Force Stop Reanalysis:**
```json
{"action": "stop"}
```

#### **Server-to-Client Payloads (Broadcast Stream)**
The server emits standard status payloads continuously while running.
```json
{
  "type": "progress",
  "current_status": "running",
  "subreddit": "Munich",
  "processed": 145,
  "total": 1250,
  "percent": 11.6,
  "message": "r/Munich | Dynamic Progress: 145/1250 (11.6%)"
}
```