# HashFeed — Live Tweet Monitor

Auto-refreshing Twitter feed for **#iran**, **#trump**, and **#saudi** hashtags.

## Features

- Live tweet feed with 30-second auto-refresh
- Filter by individual hashtag or view all combined
- New tweet notifications without losing scroll position
- Works in **demo mode** (no API key needed) or **live mode** with a Twitter API key
- Responsive design — works on mobile too

## Quick Start

```bash
cd tweet-feed
npm install
npm start
```

Open http://localhost:3000

## Live Twitter Data (Optional)

To pull real tweets from X/Twitter:

1. Create a developer account at https://developer.twitter.com
2. Create a project & app, then copy the **Bearer Token**
3. Create a `.env` file:

```bash
cp .env.example .env
# Edit .env and paste your Bearer Token
```

4. Restart the server — the status indicator will show "Live data"

Without a token the app shows realistic demo data and is fully functional for UI testing.

## Architecture

- **Backend**: Node.js + Express server (`server.js`)
  - `/api/all` — returns tweets for all 3 hashtags merged
  - `/api/tweets?hashtag=iran` — returns tweets for a single hashtag
  - 30-second server-side cache to avoid rate limiting
- **Frontend**: Single HTML file with vanilla JS (`public/index.html`)
  - No framework dependencies, fast and lightweight
