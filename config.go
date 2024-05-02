package main

import (
	"fmt"
	"os"
)

var (
	OPENWEATHER_API_KEY        = os.Getenv("OPENWEATHER_API_KEY")
	LATITUDE                   = os.Getenv("LATITUDE")
	LONGITUDE                  = os.Getenv("LONGITUDE")
	BASE_URL                   = "https://api.openweathermap.org/data/2.5/"
	WEATHER_URL         string = fmt.Sprintf("%sweather?units=metric&lat=%s&lon=%s&appid=%s", BASE_URL, LATITUDE, LONGITUDE, OPENWEATHER_API_KEY)
	AIR_QUALITY_URL     string = fmt.Sprintf("%sair_pollution?units=metric&lat=%s&lon=%s&appid=%s", BASE_URL, LATITUDE, LONGITUDE, OPENWEATHER_API_KEY)
)
