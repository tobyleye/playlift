package tasks

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/hibiken/asynq"
	"github.com/tobyleye/playlift/core/converter"
	"github.com/tobyleye/playlift/models"
	"github.com/valkey-io/valkey-go"
	"github.com/zmb3/spotify/v2"
	"gorm.io/gorm"
)

type TaskHandlers struct {
	db            *gorm.DB
	cache         valkey.Client
	ytmusicClient *http.Client
	spotifyClient *spotify.Client
}

func (t *TaskHandlers) HandlePlaylistConversion(ctx context.Context, task *asynq.Task) error {
	var taskPayload ConversionTaskPayload
	payload := task.Payload()
	fmt.Println("task raw payload:", payload)
	err := json.Unmarshal(payload, &taskPayload)
	if err != nil {
		log.Println("error parsing conversion task payload:", err)
		return err
	}

	conversionId := taskPayload.ConversionId

	log.Println("handling conversion for conversion id...", conversionId)
	conversion := models.PlaylistConversion{}

	if err := t.db.First(&conversion, "conversion_id = ?", conversionId).Error; err != nil {
		log.Println("error querying conversion from db ...", err)
		return fmt.Errorf("could not find conversion: %v: %w", err, asynq.SkipRetry)
	}

	log.Println("Playlist start for: ", conversion)
	converter.Convert(t.db, t.cache, &conversion, taskPayload.Demo, t.ytmusicClient, t.spotifyClient)

	log.Println("conversion is done...")
	return nil
}

func (t *TaskHandlers) HandleSyncWatchTask(ctx context.Context, task *asynq.Task) error {
	conversionId := string(task.Payload())
	if conversionId == "" {
		return fmt.Errorf("invalid watch sync payload: %w", asynq.SkipRetry)
	}

	log.Println("handling watch sync for conversion id...", conversionId)
	if err := converter.SyncWatch(t.db, t.cache, conversionId); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("watch conversion not found: %v: %w", err, asynq.SkipRetry)
		}
		return err
	}

	return nil
}

func NewTaskHandlers(db *gorm.DB, cache valkey.Client, ytmusicClient *http.Client, spotifyClient *spotify.Client) *TaskHandlers {
	return &TaskHandlers{
		db:            db,
		cache:         cache,
		ytmusicClient: ytmusicClient,
		spotifyClient: spotifyClient,
	}
}
