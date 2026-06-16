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

### `PUT /posts/{subreddit}/{post_id}`
Updates a post's stored fields. Only `Super Admin` may perform this action.
* **Request Body:** JSON Object (include one or more of these fields)
```json
{
  "title": "Updated title",
  "body": "Updated body",
  "sentiment": "Neutral",
  "keywords": {"housing": 1},
  "entities": [{"text": "Berlin", "label": "GPE"}],
  "topics": {
    "labels": ["Living"],
    "scores": [0.88],
    "primary_topic": "Living"
  }
}
```
* **Response Format:** JSON Object
```json
{
  "message": "Post updated successfully",
  "id": "t3_abc123"
}
```

### `DELETE /posts/{subreddit}/{post_id}`
Deletes a stored post record. Only `Super Admin` may perform this action.
* **Request Body:** None
* **Response Format:** JSON Object
```json
{
  "message": "Post deleted successfully",
  "id": "t3_abc123"
}
```

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
Registers a new subreddit for tracking and ingestion. Only `Super Admin` may call this endpoint.
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
Modifies the tracking configuration of an existing subreddit. Only `Super Admin` may call this endpoint.
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
Permanently untracks and purges a subreddit from active indexing (does not delete associated posts). Only `Super Admin` may call this endpoint.
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
Adds a new array of ignored words to the database. All new words are stored as `approved: false` regardless of any provided approved flag.
* **Request Body:** JSON Array of Objects
```json
[
  {
    "word": "testword",
    "language": "en"
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
Updates the metadata and control flags for a specific ignored word. Only `Super Admin` may call this endpoint.
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
Permanently deletes a word from the ignored words list. Only `Super Admin` may call this endpoint.
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

> Only `Super Admin` may send `start`, `pause`, `resume`, or `stop` actions. Other authenticated clients may still connect and request `status` updates.

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

---

## 5. Users Endpoints (`/Routes/routes_users.py`)

### `POST /users/create`
Creates a new user account and registers it with Firebase Auth and the local database. Only `Super Admin` may call this endpoint.
* **Request Body:** JSON Object
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "name": "Full Name",
  "role": "Guest User",               
  "api_calls_limit": 1000
}
```
* **Response Format:** JSON Object
```json
{
  "status": "success",
  "message": "Account synchronized successfully for user@example.com assigned to tier: Guest User."
}
```

### `POST /users/generate-api-key`
Generates (or rotates) a high-entropy API key for the calling authenticated user. Requires authentication (API key or Firebase session). Returns the newly created API key (displayed once).
* **Request Body:** None
* **Response Format:** JSON Object
```json
{
  "status": "success",
  "api_key": "alfaz_live_...",
  "note": "Copy this token carefully. For security reasons, it will not be displayed again."
}
```

### `GET /users/me`
Returns the caller's profile information and role. Requires authentication (API key or Firebase session).
* **Request Body:** None
* **Response Format:** JSON Object
```json
{
  "id": 12,
  "email": "user@example.com",
  "role": "Admin",
  "authenticated_via": "api_key",
  "api_key": null
}
```

* **Special behavior:** if the caller is a `Super Admin`, the endpoint includes `api_key` with the stored API key value when available. For all other roles, `api_key` is always `null`.

### `GET /users`
Retrieves the full list of registered user profiles. Only `Super Admin` may call this endpoint.
* **Request Body:** None
* **Response Format:** JSON Array of User Objects
```json
[
  {
    "id": 12,
    "firebase_uid": "UID123",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "Super Admin",
    "api_calls_limit": 1000,
    "api_calls_count": 0,
    "api_key": "alfaz_live_...",
    "created_at": "2026-06-11T12:00:00"
  },
  {
    "id": 13,
    "firebase_uid": "UID456",
    "name": "Guest User",
    "email": "guest@example.com",
    "role": "Guest User",
    "api_calls_limit": 1000,
    "api_calls_count": 15,
    "api_key": null,
    "created_at": "2026-06-10T16:30:00"
  }
]
```

### Authorization Notes
- `Super Admin`: required to create new users (`POST /users/create`) and to modify user roles (role-management endpoints are restricted to Super Admin where implemented).
- `Admin`: administrative role; in the current API `Admin` may perform management tasks where specific endpoints exist. API call generation is available to any authenticated user via `POST /users/generate-api-key`.
- Authenticated users (API key or Firebase session) can call `GET /users/me` to inspect their profile.
