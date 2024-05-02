package main

import (
	"sync"
)

func weatherRoutine(weather *Weather, wg *sync.WaitGroup) {
	getWeather(weather)
	wg.Done()
}

func airQualityRoutine(airQuality *AirQuality, wg *sync.WaitGroup) {
	getAirQuality(airQuality)
	wg.Done()
}

func main() {
	var weather Weather
	var airQuality AirQuality
	wg := new(sync.WaitGroup)
	wg.Add(2)
	go weatherRoutine(&weather, wg)
	go airQualityRoutine(&airQuality, wg)
	wg.Wait()

	generateReadme(&weather, &airQuality)
}
