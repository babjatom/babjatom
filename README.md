# X Hashtag Tweet Feed

A simple, auto-refreshing Twitter/X-like website that pulls recent tweets for **#Iran**, **#Trump**, and **#Saudi** hashtags and displays them in a clean, dark-themed feed.

## Features

- **Live Twitter/X feed** — pulls recent tweets via the Twitter API v2 search endpoint
- **Auto-refresh** — the feed refreshes every 30 seconds automatically
- **Three hashtag tabs** — switch between #Iran, #Trump, and #Saudi with one click
- **Demo mode** — works without API credentials using realistic mock data
- **Dark theme** — modern, Twitter/X-inspired dark UI
- **Server-side caching** — 60-second cache to avoid hitting API rate limits
- **Mobile responsive** — looks great on any screen size
- **Zero dependencies** — pure Go backend, vanilla HTML/CSS/JS frontend

## Quick Start

```bash
# Clone and build
git clone <repo-url>
cd hashtag-feed
go build -o hashtag-feed .

# Run in demo mode (no API key needed)
./hashtag-feed

# Or run with live Twitter data
export TWITTER_BEARER_TOKEN="your-bearer-token-here"
./hashtag-feed
```

Open **http://localhost:8080** in your browser.

## Configuration

| Environment Variable    | Required | Default | Description                          |
|------------------------|----------|---------|--------------------------------------|
| `TWITTER_BEARER_TOKEN` | No       | —       | Twitter API v2 Bearer Token for live data. Without it, the app runs in demo mode with mock tweets. |
| `PORT`                 | No       | `8080`  | HTTP server port                     |

## Getting a Twitter Bearer Token

1. Go to the [Twitter Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a new project and app
3. Generate a **Bearer Token** from the "Keys and Tokens" section
4. Set it as an environment variable: `export TWITTER_BEARER_TOKEN="your-token"`

## How It Works

- **Backend**: Go HTTP server with two endpoints:
  - `GET /` — serves the single-page frontend
  - `GET /api/tweets?hashtag=iran|trump|saudi` — returns JSON tweet data
- **Frontend**: vanilla HTML/CSS/JS embedded in the Go binary
- **Caching**: server-side in-memory cache with a 60-second TTL
- **Fallback**: if the Twitter API is unavailable or unconfigured, realistic mock data is served

## Development

```bash
# Build and run
make run

# Or directly
go run .
```
