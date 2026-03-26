package main

import "os"

var (
	TwitterBearerToken = os.Getenv("TWITTER_BEARER_TOKEN")
	Port               = getEnvOrDefault("PORT", "8080")
)

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
