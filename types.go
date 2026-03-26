package main

// Twitter API v2 recent search response (subset).
type searchResponse struct {
	Data     []tweet     `json:"data"`
	Includes *includes   `json:"includes,omitempty"`
	Errors   []apiError  `json:"errors,omitempty"`
	Meta     *searchMeta `json:"meta,omitempty"`
}

type includes struct {
	Users []user `json:"users"`
}

type user struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Username        string `json:"username"`
	ProfileImageURL string `json:"profile_image_url"`
}

type tweet struct {
	ID        string `json:"id"`
	Text      string `json:"text"`
	CreatedAt string `json:"created_at"`
	AuthorID  string `json:"author_id"`
}

type apiError struct {
	Title  string `json:"title"`
	Detail string `json:"detail"`
}

type searchMeta struct {
	ResultCount int `json:"result_count"`
}

// FeedItem is a normalized row for the UI and JSON API.
type FeedItem struct {
	ID           string `json:"id"`
	Text         string `json:"text"`
	CreatedAt    string `json:"created_at"`
	AuthorName   string `json:"author_name"`
	AuthorHandle string `json:"author_handle"`
	AvatarURL    string `json:"avatar_url,omitempty"`
	TweetURL     string `json:"tweet_url"`
}

type feedResponse struct {
	OK          bool       `json:"ok"`
	Message     string     `json:"message,omitempty"`
	Warning     string     `json:"warning,omitempty"`
	Items       []FeedItem `json:"items"`
	RefreshedAt string     `json:"refreshed_at"`
	IntervalSec int        `json:"interval_sec"`
}
