# Subreddit Analytics Engine - API Documentation

This document defines the RESTful and WebSocket interface for the Subreddit Analytics Engine.

---

## 0. Authentication & Security

The API uses a dual-layer authentication system:
-   **API Keys**: Prefixed with `alfaz_live_`, used for server-to-server or programmatic access.
-   **Firebase Identity**: Bearer tokens issued by Firebase Auth for frontend sessions.
-   **Role-Based Access Control (RBAC)**: Certain endpoints require `Super Admin`, `Admin`, or `Developer` roles. `Guest User` is the default.

### WebSocket Ticket System
To secure WebSockets (which do not support custom headers in all browsers), clients must exchange their Bearer token for a short-lived (30s), single-use **Ticket ID** via `POST /users/ws/ticket`.

---

## 1. Posts Endpoints (`/Routes/routes_posts.py`)

### `GET /summary`
Retrieves a high-level cache summary of post counts and latest activity per subreddit.
*   **Response**: `dict` (Subreddit Name -> Summary Object)

### `GET /posts`
The primary endpoint for retrieving posts using **Base64 Compound Cursor** pagination.
*   **Query Parameters**:
    *   `limit`: (int, 1-100, default 20)
    *   `cursor`: (string, optional) The encoded token from the previous response.
    *   `direction`: ("next" | "prev", default "next")
    *   `subreddit`: (string, optional) Filter by subreddit name.

### `GET /posts/keywords`
Aggregates keywords across the database with sentiment distribution.
*   **Query Parameters**: `subreddit` (opt), `min_frequency` (default 1), `limit` (default 500).
*   **Response**: Array of objects containing word frequency, sentiment counts, and whether the word is "reported" (in the ignored words list).

### `GET /posts/frequency` or `/posts/frequency/{subreddit}`
Returns localized 24-hour diurnal post and emotion frequency (00:00 - 23:00).
*   **Query Parameters**: `start_date`, `end_date` (YYYY-MM-DD).

### `GET /posts/{subreddit}` & `GET /posts/{subreddit}/all`
Legacy retrieval methods for a specific subreddit's posts.

### `PUT /posts/{subreddit}/{post_id}`
Updates metadata for a specific post. Requires `Super Admin`.
*   **Editable Fields**: `title`, `body`, `sentiment`, `sentiment_scores`, `keywords`, `entities`, `topics`, `score`, `upvote_ratio`, `num_comments`.

### `DELETE /posts/{subreddit}/{post_id}`
Permanently deletes a post record. Requires `Super Admin`.

---

## 2. Subreddits Endpoints (`/Routes/routes_subreddits.py`)

### `GET /subreddits`
Lists all tracked subreddits and their configurations (timezone, tracking status).

### `GET /subreddits/sentiments`
Returns overall sentiment distribution and per-subreddit breakdown.

### `GET /subreddits/sentiments/frequency`
Returns localized 24-hour diurnal sentiment frequency (Time-of-day analysis).

### `POST /subreddits`
Registers a new subreddit. Requires `Super Admin`.
*   **Body**: `{ "name", "description", "total_users", "is_active", "keep_updated", "timezone" }`

### `PUT /subreddits/{name}`
Modifies tracking settings or timezone. Requires `Super Admin`.

---

## 3. KPI Analytics Endpoints (`/Routes/routes_kpis.py`)

### `GET /kpis` or `GET /kpis/{subreddit_id}`
Computes the complete KPI payload, including all seven hypothesis tests and the chart time series.

### `GET /kpis/series` or `GET /kpis/series/{subreddit_id}`
Returns the KPI chart time series and aggregate post metrics without running the seven hypothesis tests. The frontend uses this lightweight endpoint to keep the chart responsive.

### `GET /kpis/h1` through `GET /kpis/h7`
Computes and returns one academic hypothesis at a time. The selected hypothesis is available in the `hypothesis` field, with request metadata and the analyzed post count in the response.
*   **Query Parameters**:
    *   `start_date`, `end_date`: ISO Date strings.
    *   `granularity`: `daily`, `weekly`, `monthly`.
    *   `sma_window`: Simple Moving Average window (1-30 days, default 7).
    *   `subreddit_id`: Optional subreddit ID for `/kpis/series` and `/kpis/h1` through `/kpis/h7`.
*   **Formula**: $50 + 50 \times \frac{\sum Pos - \sum Neg}{N}$

---

## 4. Reanalysis Pipeline (`/Routes/routes_reanalyze.py`)

### `POST /ws/ticket`
**Critical**: Generates a one-time ticket for the Reanalyze WebSocket. Requires `Super Admin`.

### `WS /ws/reanalyze?ticket={ticket_id}`
Real-time NLP pipeline control.
*   **Actions (JSON)**:
    *   `{"action": "start", "pipelines": [...], "only_null": bool, "subreddits": [...], "start_date": "...", "end_date": "..."}`
    *   `{"action": "pause"}`, `{"action": "resume"}`, `{"action": "stop"}`, `{"action": "status"}`
*   **Events**: `status`, `start`, `progress`, `complete`, `error`.

---

## 5. User Management (`/Routes/routes_users.py`)

### `POST /users/create`
Creates a user in Firebase and synchronizes them to the local DB. Requires `Super Admin`.

### `POST /users/generate-api-key`
Generates/rotates an API key for the current authenticated user.

### `GET /users/me`
Returns the current user's profile and role. `Super Admin` can see their own API key here.

### `GET /users`
Lists all registered users and their usage metrics. Requires `Super Admin`.

### `PUT /users/{user_id}`
Updates a user's role, name, email, or API call limits. Syncs changes to Firebase. Requires `Super Admin`.

### `DELETE /users/{user_id}`
Atomic deletion of a user from both local DB and Firebase. Requires `Super Admin`.

---

## 6. Ignored Words (`/Routes/routes_ignored_words.py`)

### `POST /ignored-words`
Submits a list of words to be reviewed for exclusion from keyword analytics.
*   **Status**: Defaults to `approved: false`, `processed: false`.

### `PUT /ignored-words/{word}`
Approves or rejects a word. Requires `Super Admin`.
*   **Approval Logic**: If `approved: true`, the engine automatically scrubs this word from all existing `reddit_posts` records.

---

## 7. Process Queue (`/Routes/routes_queue.py`)

### `GET /queue`
Retrieves the current state of the scraping queue, including `counts` (pending, processing, completed) and the `tasks` list.

### `PUT /queue/{subreddit}/{post_id}`
Forces a specific post back into the `pending` state for re-scraping/re-processing. Requires `Super Admin`.

### `WS /ws/queue`
A live stream that broadcasts the entire queue state whenever a database change occurs (via PG `LISTEN/NOTIFY`).
*   **Payload**: `{ "type": "QUEUE_UPDATED", "counts": {...}, "data": [...] }`