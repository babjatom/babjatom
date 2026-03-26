package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/api/tweets", handleAPI)

	addr := ":" + Port
	fmt.Printf("Hashtag Tweet Feed running on http://localhost%s\n", addr)
	if TwitterBearerToken == "" {
		fmt.Println("TWITTER_BEARER_TOKEN not set — running in demo mode with mock data")
	} else {
		fmt.Println("Twitter API configured — fetching live tweets")
	}
	log.Fatal(http.ListenAndServe(addr, nil))
}
