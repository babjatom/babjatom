package main

import (
	"fmt"
	"os"
	"strconv"
)

var (
	// XBearerToken is a Twitter/X API v2 Bearer token (from the developer portal).
	XBearerToken = os.Getenv("X_BEARER_TOKEN")
	Port         = getenvInt("PORT", 8080)
	// RefreshIntervalSec is how often the browser polls /api/feed (also used for Cache-Control).
	RefreshIntervalSec = getenvInt("REFRESH_INTERVAL_SEC", 60)
)

func getenvInt(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

func serverAddr() string {
	return fmt.Sprintf(":%d", Port)
}
