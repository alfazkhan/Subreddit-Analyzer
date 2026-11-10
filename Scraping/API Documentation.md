# Subreddit Analytics Engine - API Documentation

This document defines the RESTful and WebSocket interface for the Subreddit Analytics Engine (`Scraping/`).

---

## 0. Authentication & Security

The API uses a dual-layer authentication system implemented in `Scraping/auth_guard.py`:

* **API Keys**: Prefixed with `alfaz_live_`, used for server-to-server or programmatic access. Pass either `X-API-Key: alfaz_live_...` or `Authorization: Bearer alfaz_live_...`. Usage is metered against `api_calls_limit` (`-1` for unlimited; returns `429` when exhausted).
* **Firebase Identity**: Bearer tokens issued by Firebase Auth for frontend sessions (`Authorization: Bearer <id_token>`).
* **Role-Based Access Control (RBAC)**: Supported roles are `Super Admin`, `Admin`, `Developer`, and `Guest User` (default). Protected routes enforce `require_role(...)` and return `403` when insufficient permissions are supplied.

### WebSocket Ticket System
To secure WebSockets (which do not support custom headers in all browsers), `Super Admin` clients must exchange their Bearer token or API key for a short-lived (30s), single-use **Ticket ID** via `POST /ws/ticket`.

---

## 1. Posts Endpoints (`Routes/routes_posts.py`)

### `GET /summary`
Retrieves a high-level cache summary of active tracked subreddits, post counts, and latest post timestamps.
* **Response**: `dict` mapping subreddit name to `{ "id", "count", "last_updated" }`.

### `GET /posts`
The primary endpoint for retrieving posts using **Base64 Compound Cursor** pagination.
* **Query Parameters**:
  * `limit`: `int` (1–100, default `20`)
  * `cursor`: `string` (optional URL-safe Base64 token from the previous response)
  * `direction`: `"next"` | `"prev"` (default `"next"`)
  * `subreddit`: `string` (optional filter by subreddit name)
* **Response**: `{ "items": [...], "next_cursor": str | null, "prev_cursor": str | null, "has_more": bool, "total_count": int }`

### `GET /posts/keywords`
Aggregates keywords across the database with sentiment distribution and ignored-word reporting metadata.
* **Query Parameters**:
  * `subreddit`: `string` (optional)
  * `min_frequency`: `int` (>= 1, default `1`)
  * `limit`: `int` (1–5000, default `500`)
* **Response**: Array of `{ "word", "frequency", "sentiment_distribution": { "positive", "neutral", "negative" }, "reported" }` (`reported` is `false` or `{ "id", "language", "processed", "approved" }`).

### `GET /posts/keywords/{word}`
Returns post IDs containing the normalized keyword, ordered by timestamp descending.
* **Query Parameters**: `subreddit` (optional)
* **Response**: `{ "keyword": str, "posts": string[] }`

### `GET /posts/frequency` & `GET /posts/frequency/{subreddit}`
Returns localized 24-hour diurnal post and emotion frequency (`00:00`–`23:00`) using each subreddit's assigned timezone.
* **Query Parameters**: `start_date`, `end_date` (`YYYY-MM-DD`, optional).
* **Response**: `{ "subreddit", "start_date", "end_date", "labels": string[], "metrics": { "post_volumes", "positive_counts", "negative_counts", "neutral_counts", "avg_positive_scores", "avg_negative_scores" } }`

### `GET /posts/{subreddit}` & `GET /posts/{subreddit}/all`
Legacy retrieval endpoints returning a specific subreddit's posts sorted descending by timestamp.
* **Query Parameters (`GET /posts/{subreddit}`)**: `limit` (`int`, 1–20000, default `10`).

### `PUT /posts/{subreddit}/{post_id}`
Updates metadata or NLP fields for a specific post. Requires `Super Admin`.
* **Editable Fields**: `title`, `body`, `sentiment`, `sentiment_scores`, `keywords`, `entities`, `topics`, `score`, `upvote_ratio`, `num_comments`.

### `DELETE /posts/{subreddit}/{post_id}`
Permanently deletes a post record. Requires `Super Admin`.

---

## 2. Subreddits Endpoints (`Routes/routes_subreddits.py`)

### `GET /subreddits`
Lists all tracked subreddits ordered by `id` (configuration, user count, timezone, tracking flags).

### `GET /subreddits/{name}`
Fetches tracking details for a single subreddit by name (`404` if not found).

### `GET /subreddits/sentiments`
Returns overall sentiment distribution (`Positive`, `Neutral`, `Negative` counts and percentages) and per-subreddit breakdown.
* **Query Parameters**: `subreddit` (optional, e.g., `Berlin` or `All`).

### `GET /subreddits/sentiments/frequency`
Returns localized 24-hour diurnal sentiment frequency (`00:00`–`23:00`), aligning each subreddit to its local timezone.
* **Query Parameters**: `subreddit` (optional), `start_date`, `end_date` (`YYYY-MM-DD`, optional).

### `POST /subreddits`
Registers or updates a subreddit tracking configuration (`201 Created`). Requires `Super Admin`.
* **Body**: `{ "name", "description"?, "total_users"?, "is_active"?: true, "keep_updated"?: false, "timezone"?: "UTC" }`

### `PUT /subreddits/{name}`
Modifies tracking settings or timezone, preserving unspecified fields. Requires `Super Admin`.
* **Body**: `{ "description"?, "total_users"?, "is_active"?, "keep_updated"?, "timezone"? }`

### `DELETE /subreddits/{name}`
Deletes a subreddit tracking entry. Requires `Super Admin`.

---

## 3. KPI Analytics Endpoints (`Routes/routes_kpis.py`)

Computes empirical KPI time-series aggregations and Master's Thesis hypothesis tests organized across 4 academic pillars (`H1`–`H7`).

### `GET /kpis` & `GET /kpis/{subreddit_id}`
Computes the complete KPI payload, including all seven hypothesis tests (`summary.hypothesis_tests`) and the aggregated `time_series`.

### `GET /kpis/series` & `GET /kpis/series/{subreddit_id}`
Returns the KPI chart `time_series` and aggregate post metrics (`summary`) without running the seven hypothesis tests. The frontend uses this lightweight endpoint to keep chart rendering responsive.

### `GET /kpis/h1` through `GET /kpis/h7`
Computes and returns one academic hypothesis at a time in the `hypothesis` field, along with request metadata and `summary: { "total_analyzed_posts" }`.

### Common Query Parameters
* `subreddit_id`: `int` (optional query parameter on `/kpis`, `/kpis/series`, and `/kpis/h1`–`/kpis/h7`; path parameter on `/kpis/{subreddit_id}` and `/kpis/series/{subreddit_id}`).
* `start_date`, `end_date`: Date filter strings (`YYYY-MM-DD`).
* `granularity`: `"daily"` | `"weekly"` | `"monthly"` (default `"daily"`).
* `sma_window`: Simple Moving Average rolling window size (`int`, 1–30, default `7`).

### Time-Series Metrics
Each bucket in `time_series` reports:
* `date`, `post_count`
* `avg_score`, `avg_upvote_ratio`, `avg_num_comments`
* `avg_negative_sentiment`, `avg_positive_sentiment`
* `admin_topic_count`, `lifestyle_topic_count`
* `avg_neg_sentiment_SMA`, `avg_upvote_ratio_SMA`

---

## 4. Reanalysis Pipeline (`Routes/routes_reanalyze.py`)

### `POST /ws/ticket`
Generates a single-use WebSocket authentication ticket (30-second TTL). Requires `Super Admin`.
* **Response**: `{ "ticket": "<uuid>" }`

### `WS /ws/reanalyze?ticket={ticket_id}`
Real-time NLP reanalysis pipeline control over WebSocket.
* **Client Actions (JSON)**:
  * `{"action": "start", "pipelines": ["keywords", "sentiment", "entities", "topic"], "only_null": bool, "subreddits": [...] | null, "start_date": "...", "end_date": "..."}` *(requires `Super Admin`)*
  * `{"action": "pause"}`, `{"action": "resume"}`, `{"action": "stop"}` *(requires `Super Admin`)*
  * `{"action": "status"}` *(returns current status snapshot)*
* **Server Events**: `status`, `info`, `start`, `progress`, `complete`, `error` with `{ "type", "current_status", "subreddit", "processed", "total", "percent", "message" }`.

---

## 5. User Management (`Routes/routes_users.py`)

### `POST /users/create`
Creates a user in Firebase Auth and synchronizes them to PostgreSQL (rolling back Firebase on DB failure). Requires `Super Admin`.
* **Body**: `{ "email", "password", "name"?: "", "role"?: "Guest User", "api_calls_limit"?: 1000 }` (`-1` for unlimited).

### `POST /users/generate-api-key`
Generates or rotates an `alfaz_live_...` API key for the current authenticated user.

### `GET /users/me`
Returns the authenticated user's profile (`id`, `name`, `email`, `role`, `authenticated_via`, `api_key`). Only `Super Admin` receives their stored `api_key`.

### `GET /users`
Lists all registered users and their API usage metrics. Requires `Super Admin`.

### `PUT /users/{user_id}`
Updates a user's `role`, `api_calls_limit`, `name`, `email`, or `password` transactionally across PostgreSQL and Firebase. Requires `Super Admin`.

### `DELETE /users/{user_id}`
Atomically deletes a user from both PostgreSQL and Firebase Auth. Requires `Super Admin`.

---

## 6. Ignored Words (`Routes/routes_ignored_words.py`)

### `GET /ignored-words`
Lists all ignored-word records ordered by `id DESC`.

### `POST /ignored-words`
Submits a list of words to be reviewed for exclusion from keyword analytics (`201 Created`).
* **Body**: Array of `{ "word": str, "language"?: "en", "approved"?: false }` (server enforces `approved: false`, `processed: false` on submission).

### `PUT /ignored-words/{word}`
Approves or rejects a word. Requires `Super Admin`.
* **Body**: `{ "language"?: "en", "approved": bool }`
* **Approval Logic**: When `approved: true`, the engine atomically scrubs the word from all existing `reddit_posts.keywords` records and marks `processed: true`.

### `DELETE /ignored-words/{word}`
Permanently removes an ignored-word entry. Requires `Super Admin`.

---

## 7. Process Queue (`Routes/routes_queue.py`)

### `GET /queue`
Retrieves the current state of the scraping queue, including aggregate `counts` (`total`, `pending`, `processing`, `completed`, `failed`) and up to 500 prioritized `tasks`.

### `PUT /queue/{subreddit}/{post_id}`
Forces a post back into the `pending` state in `scraping_queue` for re-scraping/re-processing. Requires `Super Admin`.

### `WS /ws/queue`
Pushes the current queue snapshot on connect and broadcasts updates whenever a database change occurs via PostgreSQL `LISTEN/NOTIFY` (`queue_updates` channel).
* **Payload**: `{ "type": "QUEUE_UPDATED", "counts": {...}, "data": [...] }`
