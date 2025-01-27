package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
	_ "github.com/google/uuid"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func sendPingRequest(wg * sync.WaitGroup, ch chan<- bool) {
	defer wg.Done()

	req, err := http.NewRequest("GET", "http://localhost:3010/ping", nil)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		ch <- false
		return
	}

	client := &http.Client{
		Timeout: time.Second * 30,
		Transport: &http.Transport{
			MaxIdleConnsPerHost: 100,
		},
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending request: %v", err)
		ch <- false
		return
	}
	defer resp.Body.Close()



	if resp.StatusCode == http.StatusOK {
		ch <- true
	} else {
		ch <- false
	}
}

func sendCreateUserRequest(url string, request LoginRequest, wg *sync.WaitGroup, ch chan<- bool) {
	defer wg.Done()

	jsonData, err := json.Marshal(request)
	if err != nil {
		log.Printf("Error marshalling JSON: %v", err)
		ch <- false
		return
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		ch <- false
		return
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: time.Second * 30,
		Transport: &http.Transport{
			MaxIdleConnsPerHost: 100,
		},
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending request: %v", err)
		ch <- false
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusCreated {
		log.Println("Request successful")
		ch <- true
	} else {
		log.Println("Request failed:", resp.StatusCode)
		ch <- false
	}
}

func main() {
	url := "http://localhost:3010/auth/create"
	_ = url

	numRequests := 150

	var wg sync.WaitGroup
	results := make(chan bool, numRequests)

	startTime := time.Now()

	for i := 0; i < numRequests; i++ {
		wg.Add(1)
		// loginReq := LoginRequest{
		// 	Username: uuid.New().String(),
		// 	Password: "testPassword",
		// }
		// go sendCreateUserRequest(url, loginReq, &wg, results)
		go sendPingRequest(&wg, results)
	}

	wg.Wait()
	close(results)

	successCount := 0
	failCount := 0
	for result := range results {
		if result {
			successCount++
		} else {
			failCount++
		}
	}

	duration := time.Since(startTime)

	fmt.Printf("Load test completed in %v\n", duration)
	fmt.Printf("Total Requests Sent: %d\n", numRequests)
	fmt.Printf("Successful Requests: %d\n", successCount)
	fmt.Printf("Failed Requests: %d\n", failCount)
}
