package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

func searchTweets(hashtag string) (*TwitterSearchResponse, error) {
	query := url.QueryEscape(fmt.Sprintf("#%s -is:retweet lang:en", hashtag))
	apiURL := fmt.Sprintf(
		"https://api.twitter.com/2/tweets/search/recent?query=%s&max_results=20&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username,profile_image_url,verified",
		query,
	)

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+TwitterBearerToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("twitter API returned %d: %s", resp.StatusCode, string(body))
	}

	var searchResp TwitterSearchResponse
	if err := json.Unmarshal(body, &searchResp); err != nil {
		return nil, fmt.Errorf("unmarshaling response: %w", err)
	}

	return &searchResp, nil
}

func transformTweets(resp *TwitterSearchResponse) []FeedTweet {
	if resp == nil || len(resp.Data) == 0 {
		return []FeedTweet{}
	}

	userMap := make(map[string]TwitterUser)
	if resp.Includes != nil {
		for _, u := range resp.Includes.Users {
			userMap[u.ID] = u
		}
	}

	tweets := make([]FeedTweet, 0, len(resp.Data))
	for _, d := range resp.Data {
		ft := FeedTweet{
			ID:        d.ID,
			Text:      d.Text,
			CreatedAt: d.CreatedAt.Format(time.RFC3339),
			TweetURL:  fmt.Sprintf("https://x.com/i/status/%s", d.ID),
		}

		if user, ok := userMap[d.AuthorID]; ok {
			ft.AuthorName = user.Name
			ft.AuthorUsername = user.Username
			ft.ProfileImageURL = user.ProfileImageURL
		}

		if d.Metrics != nil {
			ft.RetweetCount = d.Metrics.RetweetCount
			ft.ReplyCount = d.Metrics.ReplyCount
			ft.LikeCount = d.Metrics.LikeCount
			ft.QuoteCount = d.Metrics.QuoteCount
		}

		tweets = append(tweets, ft)
	}

	return tweets
}
