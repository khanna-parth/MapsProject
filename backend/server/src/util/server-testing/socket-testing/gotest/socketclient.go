package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	// "time"

	"github.com/google/uuid"
)

type CreateRequest struct {
	Username string `json:"username"`
	FirstName string `json:"firstName"`
	LastName string `json:"lastName"`
	Email string `json:"email"`
	Password string `json:"password"`
}

type UserObj struct {
	Username string
	UserID string
}

type Counter struct {
	Freq map[string]int
	Lock *sync.Mutex
}

func (c *Counter) Add(k string) {
	c.Lock.Lock()
	defer c.Lock.Unlock()
	c.Freq[k] += 1
}

func (c *Counter) Sub(k string) {
	c.Lock.Lock()
	defer c.Lock.Unlock()
	c.Freq[k] -= 1
}

func (c *Counter) Print() {
	fmt.Println("-------")
	for k, v := range c.Freq {
		fmt.Printf("%s's location has been recieved %d times\n", k, v)
	}
	fmt.Println("-------")
}

func (c *Counter) Stats(ids []string) *[]string {
	data := []string{}
	for k, v := range c.Freq {
		data = append(data, fmt.Sprintf("%s's location has been recieved %d times\n", k, v))
	}
	for _, id := range ids {
		count, ok := c.Freq[id]
		if !ok || count <= 0 {
			data = append(data, fmt.Sprintf("ERROR: %s's location was never incremented\n", id))
		}
	}
	return &data
}

func createUser(i int, idCh chan UserObj, wg *sync.WaitGroup) {
	defer wg.Done()
	client := &http.Client{}
	uid := uuid.NewString()
	data := CreateRequest{
		Username: uid,
		FirstName: fmt.Sprintf("%s%d", uid, i),
		LastName: fmt.Sprintf("%s%d", uuid.NewString(), i),
		Email: uuid.NewString(),
		Password: "password",
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println(err)
		return
	}

	req, err := http.NewRequest("POST", "http://localhost:3020/auth/create", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println(err)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println(err)
		return
	}

	defer resp.Body.Close()

	body, err:= io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err)
		return
	}

	if resp.StatusCode != 201 {
		fmt.Printf("Invalid status %d\n", resp.StatusCode)
		fmt.Println(string(body))
		return
	}

	type Resp struct {
		UserID string `json:"userID"`
	}

	var respData Resp

	if err := json.Unmarshal(body, &respData); err != nil {
		fmt.Println(err)
		return
	}

	fmt.Printf("ID retrieved: %s\n", respData.UserID)
	idCh <- UserObj{
		Username: data.Username,
		UserID: respData.UserID,
	}
}

func Listen(ids *[]string, usernames *[]string, idCh chan UserObj) {
	for {
		id := <- idCh
		*ids = append(*ids, id.UserID)
		*usernames = append(*usernames, id.Username)
	}
}

func StartSocket(id string, partyID string, freq *Counter) {
	cmd := exec.Command("node", "socketUser", id, partyID)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		fmt.Println("Error creating stdout pipe:", err)
		return
	}

	err = cmd.Start()
	if err != nil {
		fmt.Println("Error starting the command:", err)
		return
	}

	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := scanner.Text()
		// fmt.Println(line)

		if strings.Contains(line, "location") {
			elems := strings.Split(line, ":")
			uid := strings.TrimSpace(elems[1])
			// fmt.Printf("Recieved update from %s\n", uid)
			freq.Add(uid)
		}

	}

	if err := scanner.Err(); err != nil {
		fmt.Println("Error reading from stdout:", err)
	}

	err = cmd.Wait()
	if err != nil {
		fmt.Println("Error waiting for the command to finish:", err)
		return
	}

	fmt.Println("Command finished.")
}

func log(data []string) {
	f, err := os.Create("test.txt")
	if err != nil {
		fmt.Println(err)
		return
	}
	for _, line := range data {
		_, err := f.WriteString(line)
		if err != nil {
			fmt.Println(err)
			f.Close()
			return
		}
	}
	err = f.Close()
	if err != nil {
		fmt.Println(err)
		return
	}
}

func main() {
	conns := flag.Int("conns", 0, "Provide the number of conns to simulate over the socket")
	partyID := flag.String("partyID", "", "Provide the number of conns to simulate over the socket")
	
	flag.Parse()

	if conns == nil {
		panic("Conns is empty. Must be provided")
	}

	if partyID == nil {
		panic("partyID is empty. Must be provided")
	}

	fmt.Printf("Limit: %d\n", *conns)


	ids := []string{}
	usernames := []string{}
	idCh := make(chan UserObj)
	freq := &Counter{
		Freq: map[string]int{},
		Lock: &sync.Mutex{},
	}

	go Listen(&ids, &usernames, idCh)

	wg := &sync.WaitGroup{}

	for i := range *conns {
		wg.Add(1)
		go createUser(i, idCh, wg)
	}

	wg.Wait()

	fmt.Println("Accumulated IDs")
	fmt.Println(ids)

	os.Remove("test.txt")

	for _, id := range ids {
		go StartSocket(id, *partyID, freq)
	}

	// go func() {
	// 	tick := time.NewTicker(5 * time.Second)
	// 	defer tick.Stop()
	// 	for {
	// 		select {
	// 		case <-tick.C:
	// 			freq.Print()
	// 		}
	// 	}
	// }()


	sigs := make(chan os.Signal, 1)
    signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

    <-sigs
	log(*freq.Stats(usernames))
    fmt.Println("\nProgram received termination signal. Exiting gracefully.")
}