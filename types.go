package main

import "time"

type TwitterSearchResponse struct {
	Data     []TweetData    `json:"data"`
	Includes *TweetIncludes `json:"includes"`
	Meta     *SearchMeta    `json:"meta"`
}

type TweetData struct {
	ID        string         `json:"id"`
	Text      string         `json:"text"`
	AuthorID  string         `json:"author_id"`
	CreatedAt time.Time      `json:"created_at"`
	Metrics   *PublicMetrics `json:"public_metrics"`
}

type PublicMetrics struct {
	RetweetCount int `json:"retweet_count"`
	ReplyCount   int `json:"reply_count"`
	LikeCount    int `json:"like_count"`
	QuoteCount   int `json:"quote_count"`
}

type TweetIncludes struct {
	Users []TwitterUser `json:"users"`
}

type TwitterUser struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Username        string `json:"username"`
	ProfileImageURL string `json:"profile_image_url"`
	Verified        bool   `json:"verified"`
}

type SearchMeta struct {
	NewestID    string `json:"newest_id"`
	OldestID    string `json:"oldest_id"`
	ResultCount int    `json:"result_count"`
}

type FeedTweet struct {
	ID              string `json:"id"`
	Text            string `json:"text"`
	AuthorName      string `json:"author_name"`
	AuthorUsername  string `json:"author_username"`
	ProfileImageURL string `json:"profile_image_url"`
	CreatedAt       string `json:"created_at"`
	RetweetCount    int    `json:"retweet_count"`
	ReplyCount      int    `json:"reply_count"`
	LikeCount       int    `json:"like_count"`
	QuoteCount      int    `json:"quote_count"`
	TweetURL        string `json:"tweet_url"`
}

type APIResponse struct {
	Tweets    []FeedTweet `json:"tweets"`
	Hashtag   string      `json:"hashtag"`
	FetchedAt string      `json:"fetched_at"`
	IsMock    bool        `json:"is_mock"`
	Error     string      `json:"error,omitempty"`
}

type CacheEntry struct {
	Response  APIResponse
	FetchedAt time.Time
}
