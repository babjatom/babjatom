package main

type Weather struct {
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

		Humidity float32 `json:"humidity"`
	} `json:"main"`
	Wind struct {
		Speed float32 `json:"speed"`
	} `json:"wind"`
	Rain struct {
		LastHour float32 `json:"1h"`
	}
	Visibility int `json:"visibility"`
}

type AirQuality struct {
	List []struct {
		Components struct {
			Pm2_5 float32 `json:"pm2_5"`
		} `json:"components"`
	} `json:"list"`
}
