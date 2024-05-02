package main

import (
	"fmt"
	"os"
	"strings"
	"time"
)

func generateReadme(weather *Weather, airQuality *AirQuality) {
	template, err := os.ReadFile("template.md")
	if err != nil {
		fmt.Println(err)
	}

	replacer := strings.NewReplacer(
		"{{ updated_at }}", fmt.Sprint(time.Now().Format(time.RFC3339)),
		"{{ weather }}", strings.Title(weather.Weather[0].Description),
		"{{ temp }}", fmt.Sprint(weather.Main.Temp),
		"{{ feelsLike }}", fmt.Sprint(weather.Main.FeelsLike),
		"{{ humidity }}", fmt.Sprint(weather.Main.Humidity),
		"{{ pm25 }}", fmt.Sprint(airQuality.List[0].Components.Pm2_5),
		"{{ wind }}", fmt.Sprint(weather.Wind.Speed),
		"{{ visibility }}", fmt.Sprint(weather.Visibility),
		"{{ rain }}", fmt.Sprint(weather.Rain.LastHour),
	)

	var readme string = replacer.Replace(string(template))
	os.WriteFile("README.md", []byte(readme), 0664)
}
