package main

import (
	"context"
	"fmt"
	"log"

	"github.com/hibiken/asynq"
	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/db"
	"github.com/tobyleye/playlift/tasks"
	"github.com/valkey-io/valkey-go"
)

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

	tasksManager := tasks.NewTasksManager(db, cache)
	mux.HandleFunc(tasks.TypeTestTask, func(ctx context.Context, t *asynq.Task) error {
		fmt.Println("handling task email delivery!!!")
		return nil
	})

	mux.HandleFunc(tasks.TypeConvertPlaylist, tasksManager.HandlePlaylistConversion)
	mux.HandleFunc(tasks.TypeSyncWatch, tasksManager.HandleSyncWatchTask)
	if err := srv.Run(mux); err != nil {
		log.Fatalf("could not run server: %v", err)
	}
}
