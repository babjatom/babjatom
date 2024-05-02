package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func getRequest(url string) ([]byte, error) {
	defer timer("GET " + url)()
	res, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	return body, err
}

func getWeather(weather *Weather) {
	res, err := getRequest(WEATHER_URL)
	if err != nil {
		fmt.Println("Request failed ", err)
	}
	if err := json.Unmarshal(res, weather); err != nil {
		fmt.Println("Can not unmarshal JSON")
		fmt.Println(err)
	}
}

func getAirQuality(airQuality *AirQuality) {
	res, err := getRequest(AIR_QUALITY_URL)
	if err != nil {
		fmt.Println("Request failed ", err)
	}
	if err := json.Unmarshal(res, airQuality); err != nil {
		fmt.Println("Can not unmarshal JSON")
		fmt.Println(err)
	}
}
