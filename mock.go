package main

import (
	"fmt"
	"math/rand"
	"time"
)

var mockAuthors = []struct {
	Name     string
	Username string
	Avatar   string
}{
	{"World News Hub", "worldnewshub", ""},
	{"Political Analyst", "polianalyst", ""},
	{"Breaking Updates", "breakingupdates", ""},
	{"Middle East Watch", "mewatch", ""},
	{"Global Affairs", "globalaffairs", ""},
	{"News Reporter", "newsreporter", ""},
	{"International Desk", "intldesk", ""},
	{"Daily Digest", "dailydigest", ""},
}

var mockTemplates = map[string][]string{
	"iran": {
		"Breaking: New developments in #Iran as diplomatic talks continue in the region. Stay tuned for updates.",
		"The latest from #Iran — economic reforms are showing promising signs as trade negotiations advance.",
		"#Iran's cultural heritage sites have been nominated for new UNESCO recognition. Incredible history.",
		"Analysts weigh in on #Iran's latest foreign policy moves and what they mean for the region.",
		"Tech innovation in #Iran continues to grow with new startups emerging in Tehran's tech corridor.",
		"#Iran's national football team prepares for upcoming World Cup qualifiers with new coaching staff.",
		"Oil markets react to latest #Iran developments. Energy analysts are watching closely.",
		"New academic exchange programs between #Iran and European universities announced today.",
	},
	"trump": {
		"#Trump makes headlines again with latest policy announcement. Political commentators react.",
		"Social media erupts after #Trump's latest speech at rally. Supporters and critics weigh in.",
		"#Trump's legal team releases new statement regarding ongoing proceedings.",
		"Markets react to #Trump's latest economic proposals. Wall Street analysts share their take.",
		"#Trump campaign announces new stops on upcoming tour. Expect large crowds.",
		"Former aides share insights about #Trump's decision-making process in new book release.",
		"#Trump supporters rally in key swing states ahead of important political events.",
		"New polling data shows #Trump's standing among likely voters. The numbers are interesting.",
	},
	"saudi": {
		"#Saudi Arabia's Vision 2030 continues to transform the kingdom's economic landscape.",
		"NEOM progress update: #Saudi Arabia's futuristic city project reaches new construction milestone.",
		"#Saudi Arabia announces major renewable energy investment as part of green initiative.",
		"Tourism boom in #Saudi Arabia as new entertainment venues and resorts open their doors.",
		"#Saudi Arabian Grand Prix preparations underway — F1 fans are excited for the race weekend.",
		"#Saudi Arabia's tech sector grows with new AI research center opening in Riyadh.",
		"Diplomatic meetings in Riyadh as #Saudi Arabia hosts regional summit on trade cooperation.",
		"#Saudi Arabia's cultural season kicks off with international artists and performances.",
	},
}

func generateMockTweets(hashtag string) []FeedTweet {
	templates, ok := mockTemplates[hashtag]
	if !ok {
		templates = []string{
			fmt.Sprintf("Interesting developments around #%s today. What are your thoughts?", hashtag),
			fmt.Sprintf("The latest news about #%s is making waves across social media.", hashtag),
			fmt.Sprintf("Breaking: Major update related to #%s — details emerging.", hashtag),
			fmt.Sprintf("Experts share their analysis on the #%s situation. Thread below.", hashtag),
			fmt.Sprintf("Hot take: #%s is the most important topic of the week. Here's why.", hashtag),
		}
	}

	tweets := make([]FeedTweet, 0, len(templates))
	now := time.Now()

	for i, text := range templates {
		author := mockAuthors[rand.Intn(len(mockAuthors))]
		createdAt := now.Add(-time.Duration(i*7+rand.Intn(15)) * time.Minute)
		tweetID := fmt.Sprintf("mock_%s_%d_%d", hashtag, now.Unix(), i)

		tweets = append(tweets, FeedTweet{
			ID:              tweetID,
			Text:            text,
			AuthorName:      author.Name,
			AuthorUsername:  author.Username,
			ProfileImageURL: author.Avatar,
			CreatedAt:       createdAt.Format(time.RFC3339),
			RetweetCount:    rand.Intn(500),
			ReplyCount:      rand.Intn(200),
			LikeCount:       rand.Intn(2000),
			QuoteCount:      rand.Intn(100),
			TweetURL:        fmt.Sprintf("https://x.com/%s/status/%s", author.Username, tweetID),
		})
	}

	return tweets
}
