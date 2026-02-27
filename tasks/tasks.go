package tasks

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/hibiken/asynq"
	"github.com/tobyleye/playlift/core/converter"
	"github.com/tobyleye/playlift/models"
	"github.com/valkey-io/valkey-go"
	"gorm.io/gorm"
)

// A list of task types.
const (
	TypeConvertPlaylist = "playlist:convert"
	TypeSyncWatch       = "watch:sync"
	TypeTestTask        = "test:task"
)

func NewPlaylistConversionTask(conversionId string) *asynq.Task {
	return asynq.NewTask(TypeConvertPlaylist, []byte(conversionId))
}

func NewSyncWatchTask(conversionId string, startTime time.Time) *asynq.Task {
	return asynq.NewTask(TypeSyncWatch, []byte(conversionId), asynq.ProcessAt(startTime))
}

type TasksManager struct {
	db    *gorm.DB
	cache valkey.Client
}

func (t *TasksManager) HandlePlaylistConversion(ctx context.Context, task *asynq.Task) error {

	conversionId := string(task.Payload())

	log.Println("handling conversion for conversion id...", conversionId)
	conversion := models.PlaylistConversion{}

	if err := t.db.First(&conversion, "conversion_id = ?", conversionId).Error; err != nil {
		log.Println("error querying conversion from db ...", err)
		return fmt.Errorf("could not find conversion: %v: %w", err, asynq.SkipRetry)
	}

	log.Println("Playlist start for: ", conversion)
	converter.Convert(t.db, t.cache, &conversion)
	log.Println("conversion is done...")
	return nil
}

func (t *TasksManager) HandleSyncWatchTask(ctx context.Context, task *asynq.Task) error {
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

func NewTasksManager(db *gorm.DB, cache valkey.Client) *TasksManager {
	return &TasksManager{
		db:    db,
		cache: cache,
	}
}
