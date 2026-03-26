package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

var (
	cache    = make(map[string]*CacheEntry)
	cacheMu  sync.RWMutex
	cacheTTL = 60 * time.Second
)

func getCachedOrFetch(hashtag string) APIResponse {
	cacheMu.RLock()
	entry, exists := cache[hashtag]
	cacheMu.RUnlock()

	if exists && time.Since(entry.FetchedAt) < cacheTTL {
		return entry.Response
	}

	resp := fetchTweets(hashtag)

	cacheMu.Lock()
	cache[hashtag] = &CacheEntry{
		Response:  resp,
		FetchedAt: time.Now(),
	}
	cacheMu.Unlock()

	return resp
}

func fetchTweets(hashtag string) APIResponse {
	if TwitterBearerToken == "" {
		tweets := generateMockTweets(hashtag)
		return APIResponse{
			Tweets:    tweets,
			Hashtag:   hashtag,
			FetchedAt: time.Now().Format(time.RFC3339),
			IsMock:    true,
		}
	}

	searchResp, err := searchTweets(hashtag)
	if err != nil {
		fmt.Printf("Twitter API error for #%s: %v — falling back to mock data\n", hashtag, err)
		tweets := generateMockTweets(hashtag)
		return APIResponse{
			Tweets:    tweets,
			Hashtag:   hashtag,
			FetchedAt: time.Now().Format(time.RFC3339),
			IsMock:    true,
			Error:     err.Error(),
		}
	}

	tweets := transformTweets(searchResp)
	return APIResponse{
		Tweets:    tweets,
		Hashtag:   hashtag,
		FetchedAt: time.Now().Format(time.RFC3339),
		IsMock:    false,
	}
}

func handleAPI(w http.ResponseWriter, r *http.Request) {
	hashtag := strings.TrimSpace(r.URL.Query().Get("hashtag"))
	allowed := map[string]bool{"iran": true, "trump": true, "saudi": true}

	if hashtag == "" || !allowed[strings.ToLower(hashtag)] {
		hashtag = "iran"
	}
	hashtag = strings.ToLower(hashtag)

	resp := getCachedOrFetch(hashtag)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(resp)
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprint(w, indexHTML)
}
