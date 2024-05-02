package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

func timer(name string) func() {
	start := time.Now()
	return func() {
		fmt.Printf("%s execution took %v\n", name, time.Since(start))
	}
}

func getRequest(url string) ([]byte, error) {
	defer timer("GET " + url)()
	res, err := http.Get(url)
	if err != nil {
		fmt.Println("%s", err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		fmt.Println(err)
	}
	return body, err
}

var (
	OPENWEATHER_API_KEY        = os.Getenv("OPENWEATHER_API_KEY")
	WEATHER_URL         string = "https://api.openweathermap.org/data/2.5/weather?units=metric&" + "lat=13.9125&lon=100.606667&appid=" + OPENWEATHER_API_KEY
	AIR_QUALITY_URL     string = "https://api.openweathermap.org/data/2.5/air_pollution?units=metric&" + "lat=13.9125&lon=100.606667&appid=" + OPENWEATHER_API_KEY
)

func getWeather(weather *Weather, wg *sync.WaitGroup) {
	res, err := getRequest(WEATHER_URL)
	if err != nil {
		fmt.Println("Request failed ", err)
	}
	if err := json.Unmarshal(res, weather); err != nil {
		fmt.Println("Can not unmarshal JSON")
		fmt.Println(err)
	}
	wg.Done()
}

func getAirQuality(airQuality *AirQuality, wg *sync.WaitGroup) {
	res, err := getRequest(AIR_QUALITY_URL)
	if err != nil {
		fmt.Println("Request failed ", err)
	}
	if err := json.Unmarshal(res, airQuality); err != nil {
		fmt.Println("Can not unmarshal JSON")
		fmt.Println(err)
	}
	wg.Done()
}

func main() {
	var weather Weather
	var airQuality AirQuality
	wg := new(sync.WaitGroup)
	wg.Add(2)
	go getWeather(&weather, wg)
	go getAirQuality(&airQuality, wg)
	wg.Wait()

	template, err := os.ReadFile("template.md")
	if err != nil {
		fmt.Println(err)
	}

	replacer := strings.NewReplacer(
		"{{ updated_at }}", fmt.Sprint(time.Now().UTC()),
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
