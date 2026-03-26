package main

import (
	"embed"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"
)

//go:embed static
var staticFS embed.FS

type cachedFeed struct {
	mu      sync.RWMutex
	items   []FeedItem
	fetched time.Time
	ttl     time.Duration
}

var feedCache = cachedFeed{ttl: 45 * time.Second}

func getCachedFeed(bearer string) (items []FeedItem, errMsg string, ok bool) {
	feedCache.mu.Lock()
	defer feedCache.mu.Unlock()
	if time.Since(feedCache.fetched) < feedCache.ttl && feedCache.fetched.After(time.Time{}) {
		return feedCache.items, "", true
	}
	fresh, err := fetchRecentFeed(bearer)
	feedCache.fetched = time.Now()
	if err != nil {
		if len(feedCache.items) > 0 {
			return feedCache.items, err.Error(), true
		}
		return []FeedItem{}, err.Error(), false
	}
	feedCache.items = fresh
	return fresh, "", true
}

func handleFeed(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")

	items, errMsg, ok := getCachedFeed(XBearerToken)
	resp := feedResponse{
		Items:       items,
		RefreshedAt: time.Now().UTC().Format(time.RFC3339),
		IntervalSec: RefreshIntervalSec,
	}
	if !ok {
		resp.OK = false
		if XBearerToken == "" {
			resp.Message = "Set environment variable X_BEARER_TOKEN to your X API v2 Bearer token."
		} else {
			resp.Message = errMsg
		}
	} else {
		resp.OK = true
		if errMsg != "" {
			resp.Warning = errMsg
		}
	}
	if resp.Items == nil {
		resp.Items = []FeedItem{}
	}
	_ = json.NewEncoder(w).Encode(resp)
}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"interval_sec": RefreshIntervalSec,
		"has_config":   XBearerToken != "",
	})
}

func runServer() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/feed", handleFeed)
	mux.HandleFunc("/api/config", handleConfig)
	mux.Handle("/", http.FileServer(http.FS(staticFS)))

	addr := serverAddr()
	log.Printf("Hashtag feed listening on http://localhost%s (set X_BEARER_TOKEN)", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
