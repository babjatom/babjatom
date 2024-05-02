package main

import (
	"fmt"
	"time"
)

func timer(name string) func() {
	start := time.Now()
	return func() {
		fmt.Printf("%s execution took %v\n", name, time.Since(start))
	}
}
