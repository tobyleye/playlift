package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/hibiken/asynq"
	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/db"
	"github.com/tobyleye/playlift/tasks"
	"github.com/valkey-io/valkey-go"
	"github.com/zmb3/spotify/v2"
	"golang.org/x/oauth2"
)

func createSpotifyClient() (*spotify.Client, error) {
	form := url.Values{}
	form.Set("grant_type", "client_credentials")

	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}

	clientId := config.SPOTIFY_CLIENT_ID
	clientSecret := config.SPOTIFY_CLIENT_SECRET

	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(clientId, clientSecret)

	resp, err := http.DefaultClient.Do(req)

	b, err := io.ReadAll(resp.Body)

	if err != nil {
		return nil, err
	}

	var token oauth2.Token
	if err := json.Unmarshal(b, &token); err != nil { /* ... */
	}

	httpClient := oauth2.NewClient(context.TODO(),
		oauth2.StaticTokenSource(&oauth2.Token{AccessToken: token.AccessToken}))
	return spotify.New(httpClient), nil
}

func main() {
	db, err := db.OpenDb()

	if err != nil {
		log.Fatal("could not connect to db:", err)
	}

	cache, err := valkey.NewClient(config.VALKEY_CLIENT_OPTIONS)

	if err != nil {
		log.Fatal("Error connecting to Redis:", err)
	}

	res, _ := cache.Do(context.Background(), cache.B().Ping().Build()).ToString()

	log.Println("Valkey connected ✅", res)

	srv := asynq.NewServer(
		asynq.RedisClientOpt{Addr: config.REDIS_ADDRESS},
		asynq.Config{
			// Specify how many concurrent workers to use
			Concurrency: 10,
			// Optionally specify multiple queues with different priority.
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
			// See the godoc for other configuration options
		},
	)

	// mux maps a type to a handler
	mux := asynq.NewServeMux()

	systemYoutubeClient, err := config.CreateSystemYoutubeClient(db)
	if err != nil {
		fmt.Println("error creating youtube client ")
	}
	systemSpotifyClient, err := createSpotifyClient()
	if err != nil {
		fmt.Println("error creating spotify client ")
	}

	taskHandlers := tasks.NewTaskHandlers(db, cache, systemYoutubeClient, systemSpotifyClient)

	mux.HandleFunc(tasks.TypeTestTask, func(ctx context.Context, t *asynq.Task) error {

		conversionId := string(t.Payload())

		for i := range 200 {
			fmt.Printf("handling TypeTestTask, index: %d. conversionId %s...\n", i, conversionId)

			msg := fmt.Sprintf(`{"message": "processing", "itemIndex": %d}`, i)

			err = cache.Do(
				ctx,
				cache.B().
					Publish().
					Channel(conversionId).
					Message(msg).
					Build(),
			).Error()

			sleepSeconds := rand.Intn(20)
			time.Sleep(time.Second * time.Duration(sleepSeconds))
		}

		return nil
	})

	mux.HandleFunc(tasks.TypeConvertPlaylist, taskHandlers.HandlePlaylistConversion)
	mux.HandleFunc(tasks.TypeSyncWatch, taskHandlers.HandleSyncWatchTask)

	if err := srv.Run(mux); err != nil {
		log.Fatalf("could not run server: %v", err)
	}
}
