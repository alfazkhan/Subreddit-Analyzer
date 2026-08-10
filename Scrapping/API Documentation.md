Here is the updated documentation reflecting the new WebSocket endpoint added to the Queue subsystem.

---

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

* `Super Admin`: required to create new users (`POST /users/create`) and to modify user roles (role-management endpoints are restricted to Super Admin where implemented).
* `Admin`: administrative role; in the current API `Admin` may perform management tasks where specific endpoints exist. API call generation is available to any authenticated user via `POST /users/generate-api-key`.
* Authenticated users (API key or Firebase session) can call `GET /users/me` to inspect their profile.

---

## 6. KPI Analytics Endpoints (`/Routes/routes_kpis.py`)

### `GET /kpis/{subreddit_id}`

Calculates the 5 Core Net Sentiment Indices (ESI, ISI, CII, CCI, EII) bounded on a 0–100 scale for a targeted city/subreddit ID over an optional time window, providing both summary aggregates and bucketed time-series data for dashboard trend charts and statistical hypothesis testing ($H_1$ & $H_2$).

* **Path Parameters:** `subreddit_id` (integer, e.g. `1` or `3`)
* **Query Parameters:**
* `start_date` (optional, ISO string format `YYYY-MM-DD`)
* `end_date` (optional, ISO string format `YYYY-MM-DD`)
* `granularity` (optional, string: `daily`, `weekly`, or `monthly`, default: `daily`)


* **Request Body:** None
* **Mathematical Formula:**

$$\text{Index} = 50 + 50 \times \left(\frac{\sum P_{\text{pos}} - \sum P_{\text{neg}}}{N}\right)$$

* **Response Format:** JSON Object

```json
{
  "subreddit_id": 3,
  "subreddit_name": "Mumbai",
  "start_date": "2026-01-01",
  "end_date": "2026-06-30",
  "granularity": "monthly",
  "total_posts_analyzed": 4375,
  "summary_kpis": {
    "economic_sentiment_index": {
      "code": "ESI",
      "score": 41.33,
      "total_posts": 944
    },
    "infrastructure_services_index": {
      "code": "ISI",
      "score": 30.81,
      "total_posts": 650
    },
    "local_consumer_intent_index": {
      "code": "CII",
      "score": 47.46,
      "total_posts": 983
    },
    "community_concern_safety_index": {
      "code": "CCI",
      "score": 32.77,
      "total_posts": 803
    },
    "expat_integration_index": {
      "code": "EII",
      "score": 42.34,
      "total_posts": 995
    }
  },
  "time_series": [
    {
      "date": "2026-01-01",
      "ESI": 45.2,
      "ESI_posts": 180,
      "ISI": 32.1,
      "ISI_posts": 120,
      "CII": 51.0,
      "CII_posts": 210,
      "CCI": 28.5,
      "CCI_posts": 150,
      "EII": 40.0,
      "EII_posts": 190
    },
    {
      "date": "2026-02-01",
      "ESI": 42.0,
      "ESI_posts": 160,
      "ISI": 35.8,
      "ISI_posts": 110,
      "CII": 48.3,
      "CII_posts": 195,
      "CCI": 31.0,
      "CCI_posts": 140,
      "EII": 44.1,
      "EII_posts": 205
    }
  ]
}

```

---

## 7. Process Queue Endpoints & Streaming (`/Routes/routes_queue.py`)

### `GET /queue`

Retrieves all tasks in the scraping and ingestion queue.

* **Request Body:** None
* **Response Format:** JSON Array of Queue Objects

```json
[
  {
    "id": 104,
    "subreddit_id": 1,
    "subreddit_name": "Munich",
    "post_id": "t3_xyz987",
    "status": "pending",
    "retry_count": 0,
    "error_message": null,
    "created_at": "2026-08-10T17:00:00",
    "updated_at": "2026-08-10T17:00:00"
  }
]

```

### `WS /ws/queue`

Real-time, single-direction WebSocket stream pushing scraping queue mutations directly to connected frontend clients. Backed by PostgreSQL `LISTEN / NOTIFY` triggers on `scraping_queue`.

#### **Connection Lifecycle**

1. **Initial Push:** Upon successful handshake, the server immediately sends the current snapshot of all tasks in the queue.
2. **Real-time Broadcasts:** Whenever a row in `scraping_queue` is inserted, updated, or deleted, a database trigger emits a `pg_notify` event (`queue_updates`), causing the API to broadcast the newly fetched queue state to all active WebSocket clients.

#### **Server-to-Client Payload Structure**

```json
{
  "type": "QUEUE_UPDATED",
  "data": [
    {
      "id": 104,
      "subreddit_id": 1,
      "subreddit_name": "Munich",
      "post_id": "t3_xyz987",
      "status": "processing",
      "retry_count": 0,
      "error_message": null,
      "created_at": "2026-08-10T17:00:00",
      "updated_at": "2026-08-10T17:02:15"
    }
  ]
}

```