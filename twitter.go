package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

const twitterSearchURL = "https://api.twitter.com/2/tweets/search/recent"

// Hashtag queries for the feed (no # in env — fixed product requirement).
var hashtagQuery = strings.Join([]string{
	"#iran",
	"#trump",
	"#saudi",
}, " OR ")

func fetchRecentFeed(bearer string) ([]FeedItem, error) {
	if bearer == "" {
		return nil, fmt.Errorf("missing X_BEARER_TOKEN")
	}

	q := url.Values{}
	q.Set("query", hashtagQuery)
	q.Set("max_results", "50")
	q.Set("tweet.fields", "created_at,author_id")
	q.Set("expansions", "author_id")
	q.Set("user.fields", "name,username,profile_image_url")

	reqURL := twitterSearchURL + "?" + q.Encode()
	req, err := http.NewRequest(http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+bearer)
	req.Header.Set("User-Agent", "hashtag-feed/1.0")

	client := &http.Client{Timeout: 25 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("twitter API %s: %s", res.Status, truncate(string(body), 500))
	}

	var parsed searchResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, err
	}
	if len(parsed.Errors) > 0 {
		var b strings.Builder
		for _, e := range parsed.Errors {
			if b.Len() > 0 {
				b.WriteString("; ")
			}
			b.WriteString(e.Title)
			if e.Detail != "" {
				b.WriteString(": ")
				b.WriteString(e.Detail)
			}
		}
		return nil, fmt.Errorf("twitter API errors: %s", b.String())
	}

	userByID := map[string]user{}
	if parsed.Includes != nil {
		for _, u := range parsed.Includes.Users {
			userByID[u.ID] = u
		}
	}

	items := make([]FeedItem, 0, len(parsed.Data))
	for _, t := range parsed.Data {
		u := userByID[t.AuthorID]
		handle := u.Username
		if handle == "" {
			handle = t.AuthorID
		}
		name := u.Name
		if name == "" {
			name = handle
		}
		items = append(items, FeedItem{
			ID:           t.ID,
			Text:         t.Text,
			CreatedAt:    t.CreatedAt,
			AuthorName:   name,
			AuthorHandle: handle,
			AvatarURL:    u.ProfileImageURL,
			TweetURL:     fmt.Sprintf("https://twitter.com/%s/status/%s", handle, t.ID),
		})
	}

	sort.SliceStable(items, func(i, j int) bool {
		ti, e1 := time.Parse(time.RFC3339, items[i].CreatedAt)
		tj, e2 := time.Parse(time.RFC3339, items[j].CreatedAt)
		if e1 != nil || e2 != nil {
			return i < j
		}
		return ti.After(tj)
	})

	return items, nil
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
