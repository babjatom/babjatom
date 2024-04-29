package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type CurrentWeatherResponse struct {
	Weather []struct {
		Id          int    `json:"id"`
		Main        string `json:"main"`
		Description string `json:"description"`
	} `json:"weather"`
	Main struct {
		Temp      float32 `json:"temp"`
		FeelsLike float32 `json:"feels_like"`
		TempMin   float32 `json:"temp_min"`
		TempMax   float32 `json:"temp_max"`
		Humidity  float32 `json:"humidity"`
	} `json:"main"`
	Wind struct {
		Speed float32 `json:"speed"`
	} `json:"wind"`
	Rain struct {
		LastHour float32 `json:"1h"`
	}
	Visibility int `json:"visibility"`
}

type CurrentAirQualityResponse struct {
	List []struct {
		Components struct {
			Pm2_5 float32 `json:"pm2_5"`
		} `json:"components"`
	} `json:"list"`
}

func timer(name string) func() {
	start := time.Now()
	return func() {
		fmt.Printf("%s execution took %v\n", name, time.Since(start))
	}
}

type result struct {
	index    int
	jsonData []byte
}

func getDataParallel() (CurrentWeatherResponse, CurrentAirQualityResponse) {
	defer timer("Parallel")()

	OPENWEATHER_API_KEY := os.Getenv("OPENWEATHER_API_KEY")
	WEATHER_URL :=
		"https://api.openweathermap.org/data/2.5/weather?units=metric&" +
			"lat=13.9125&lon=100.606667&appid=" + OPENWEATHER_API_KEY
	AIR_QUALITY_URL :=
		"https://api.openweathermap.org/data/2.5/air_pollution?units=metric&" +
			"lat=13.9125&lon=100.606667&appid=" + OPENWEATHER_API_KEY
	urls := []string{
		WEATHER_URL,
		AIR_QUALITY_URL,
	}

	ch := make(chan *result)
	defer func() {
		close(ch)
	}()

	for i, url := range urls {
		go func(i int, url string) {
			fmt.Println("Making request to", url)
			res, err := http.Get(url)
			if err != nil {
				fmt.Println("%s", err)
			}
			defer res.Body.Close()

			body, err := io.ReadAll(res.Body)
			if err != nil {
				fmt.Println(err)
			}
			result := &result{i, []byte(body)}
			ch <- result

		}(i, url)
	}

	var currentAirQualityResponse CurrentAirQualityResponse
	var currentWeatherResponse CurrentWeatherResponse

	for range urls {
		result := <-ch
		switch result.index {
		case 0:
			if err := json.Unmarshal(result.jsonData, &currentWeatherResponse); err != nil {
				fmt.Println("Can not unmarshal JSON")
				fmt.Println(err)
			}
		case 1:
			if err := json.Unmarshal(result.jsonData, &currentAirQualityResponse); err != nil {
				fmt.Println("Can not unmarshal JSON")
				fmt.Println(err)
			}
		}
	}

	return currentWeatherResponse, currentAirQualityResponse
}

func main() {
	currentWeather, currentAirQuality := getDataParallel()

	template, err := os.ReadFile("template.md")
	if err != nil {
		panic(err)
	}

	replacer := strings.NewReplacer(
		"{{ updated_at }}", fmt.Sprint(time.Now().UTC()),
		"{{ weather }}", strings.Title(currentWeather.Weather[0].Description),
		"{{ temp }}", fmt.Sprint(currentWeather.Main.Temp),
		"{{ feelsLike }}", fmt.Sprint(currentWeather.Main.FeelsLike),
		"{{ humidity }}", fmt.Sprint(currentWeather.Main.Humidity),
		"{{ pm25 }}", fmt.Sprint(currentAirQuality.List[0].Components.Pm2_5),
		"{{ wind }}", fmt.Sprint(currentWeather.Wind.Speed),
		"{{ visibility }}", fmt.Sprint(currentWeather.Visibility),
		"{{ rain }}", fmt.Sprint(currentWeather.Rain.LastHour),
	)

	var readme string = replacer.Replace(string(template))
	os.WriteFile("README.md", []byte(readme), 0664)
}
