# Hashtag tweet feed

A small web app that shows recent posts from X (Twitter) matching **#iran**, **#trump**, and **#saudi**. The page polls the server on an interval and looks like a simple Twitter-style timeline.

## Requirements

- Go 1.22+
- An [X Developer](https://developer.x.com/) project with **Bearer token** access to the v2 **Recent search** endpoint (search is not available on the free tier in many cases).

## Run

```bash
export X_BEARER_TOKEN="your_bearer_token"
# optional: PORT=8080 REFRESH_INTERVAL_SEC=60
make run
```

Open `http://localhost:8080` (or your `PORT`).

## How it works

The server calls `GET /2/tweets/search/recent` with query `(#iran OR #trump OR #saudi)`, merges and sorts by time, and serves a static UI plus `GET /api/feed` JSON for the browser.
