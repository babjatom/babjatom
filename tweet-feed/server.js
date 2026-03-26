require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const cache = new NodeCache({ stdTTL: 30 });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const HASHTAGS = ['iran', 'trump', 'saudi'];

async function fetchTweets(hashtag) {
  const cacheKey = `tweets_${hashtag}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (!BEARER_TOKEN) {
    return getMockTweets(hashtag);
  }

  try {
    const query = `#${hashtag} -is:retweet lang:en`;
    const url = 'https://api.twitter.com/2/tweets/search/recent';
    const params = {
      query,
      max_results: 20,
      'tweet.fields': 'created_at,public_metrics,author_id,text',
      'user.fields': 'name,username,profile_image_url,verified',
      expansions: 'author_id',
    };

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
      params,
    });

    const data = response.data;
    const usersMap = {};
    if (data.includes && data.includes.users) {
      data.includes.users.forEach(u => { usersMap[u.id] = u; });
    }

    const tweets = (data.data || []).map(tweet => {
      const user = usersMap[tweet.author_id] || {};
      return {
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        metrics: tweet.public_metrics || {},
        author: {
          name: user.name || 'Unknown',
          username: user.username || 'unknown',
          profile_image_url: user.profile_image_url || null,
          verified: user.verified || false,
        },
        hashtag,
      };
    });

    cache.set(cacheKey, tweets);
    return tweets;
  } catch (err) {
    console.error(`Twitter API error for #${hashtag}:`, err.response?.data || err.message);
    return getMockTweets(hashtag);
  }
}

function getMockTweets(hashtag) {
  const mockData = {
    iran: [
      { text: 'Latest developments in #iran — diplomatic talks continue as world leaders watch closely.', name: 'Middle East Monitor', username: 'MEMonitor', image: null },
      { text: 'Breaking: International response to events in #iran grows louder across global media.', name: 'World News Daily', username: 'WorldNewsD', image: null },
      { text: 'Analysis: What the latest economic sanctions mean for #iran and the region.', name: 'Geo Politics Now', username: 'GeoPolitics', image: null },
      { text: 'Cultural exchange programs between #iran and neighboring countries show promising results.', name: 'Cultural Bridge', username: 'CultBridge', image: null },
      { text: 'Youth protests in #iran drawing attention from human rights organizations worldwide.', name: 'HumanRights Watch', username: 'HRW_Global', image: null },
    ],
    trump: [
      { text: 'Former President #trump addresses rally crowd with sharp criticism of current administration.', name: 'Political Insider', username: 'PolInsider', image: null },
      { text: '#trump\'s latest statement on trade policies sparks debate among economists and policymakers.', name: 'Economic Times', username: 'EconTimes', image: null },
      { text: 'Legal proceedings involving #trump continue to draw massive public attention and media coverage.', name: 'Legal Daily', username: 'LegalDaily', image: null },
      { text: 'Poll: How does #trump\'s approval rating compare to other former presidents at this stage?', name: 'Poll Tracker', username: 'PollTracker', image: null },
      { text: '#trump endorses key Senate candidates ahead of upcoming midterm elections season.', name: 'Campaign Watch', username: 'CampWatch', image: null },
    ],
    saudi: [
      { text: '#saudi Arabia announces major investment in renewable energy infrastructure worth billions.', name: 'Energy Globe', username: 'EnergyGlobe', image: null },
      { text: 'Vision 2030: How #saudi Arabia is transforming its economy for the post-oil future.', name: 'Future Economy', username: 'FutureEcon', image: null },
      { text: '#saudi and US officials meet to discuss regional stability and security cooperation.', name: 'Diplomatic Wire', username: 'DiploWire', image: null },
      { text: 'Tourism in #saudi Arabia hits record numbers as the country opens its doors to the world.', name: 'Travel Today', username: 'TravelToday', image: null },
      { text: 'OPEC+ meeting: #saudi Arabia\'s role in shaping global oil production decisions.', name: 'Oil Market News', username: 'OilMarket', image: null },
    ],
  };

  const items = mockData[hashtag] || [];
  return items.map((item, i) => ({
    id: `mock_${hashtag}_${i}_${Date.now()}`,
    text: item.text,
    created_at: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
    metrics: {
      retweet_count: Math.floor(Math.random() * 500),
      like_count: Math.floor(Math.random() * 2000),
      reply_count: Math.floor(Math.random() * 100),
    },
    author: {
      name: item.name,
      username: item.username,
      profile_image_url: null,
      verified: Math.random() > 0.5,
    },
    hashtag,
  }));
}

app.get('/api/tweets', async (req, res) => {
  try {
    const tag = req.query.hashtag || 'iran';
    if (!HASHTAGS.includes(tag)) {
      return res.status(400).json({ error: 'Invalid hashtag. Use: iran, trump, or saudi' });
    }
    const tweets = await fetchTweets(tag);
    res.json({ tweets, hashtag: tag, timestamp: new Date().toISOString(), live: !!BEARER_TOKEN });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

app.get('/api/all', async (req, res) => {
  try {
    const results = await Promise.all(HASHTAGS.map(h => fetchTweets(h)));
    const all = results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json({ tweets: all, timestamp: new Date().toISOString(), live: !!BEARER_TOKEN });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ live: !!BEARER_TOKEN, hashtags: HASHTAGS });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Tweet Feed server running on http://localhost:${PORT}`);
  if (!BEARER_TOKEN) {
    console.log('WARNING: TWITTER_BEARER_TOKEN not set — running in demo mode with mock data');
  }
});
