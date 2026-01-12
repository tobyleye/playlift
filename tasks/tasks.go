package tasks

import (
	"context"
	"encoding/json"
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
	TypeEmailDelivery   = "email:deliver"
	TypeConvertPlaylist = "playlist:convert"
)

type EmailDeliveryPayload struct {
	UserID     string
	TemplateID string
}

func NewEmailDeliveryTask(userID string, tmplID string) (*asynq.Task, error) {
	payload, err := json.Marshal(EmailDeliveryPayload{UserID: userID, TemplateID: tmplID})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeEmailDelivery, payload), nil
}

func NewPlaylistConversionTask(conversionId string) *asynq.Task {
	return asynq.NewTask(TypeConvertPlaylist, []byte(conversionId))
}

func HandleEmailDeliveryTask(ctx context.Context, t *asynq.Task) error {
	var p EmailDeliveryPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}
	log.Printf("Sending Email to User: user_id=%s, template_id=%s", p.UserID, p.TemplateID)
	time.Sleep(time.Minute * 1)
	log.Printf("Email sent for user: %s\n", p.UserID)
	return nil
}

func HandlePlaylistConversion(db *gorm.DB, cache valkey.Client, ctx context.Context, t *asynq.Task) error {

	conversionId := string(t.Payload())

	log.Println("handling conversion for conversion id...", conversionId)
	conversion := models.PlaylistConversion{}

	if err := db.First(&conversion, "conversion_id = ?", conversionId).Error; err != nil {
		log.Println("error querying conversion from db ...", err)
		return fmt.Errorf("could not find conversion: %v: %w", err, asynq.SkipRetry)
	}

	log.Println("Playlist start for: ", conversion)
	converter.Convert(db, cache, &conversion)
	log.Println("conversion is done...")
	return nil
}
