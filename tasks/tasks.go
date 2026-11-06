package tasks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
)

// A list of task types.
const (
	TypeConvertPlaylist = "playlist:convert"
	TypeSyncWatch       = "watch:sync"
	TypeTestTask        = "test:task"
)

type ConversionTaskPayload struct {
	ConversionId string `json:"conversion_id"`
	Demo         bool   `json:"demo"`
}

func NewPlaylistConversionTask(conversionId string, demo bool) (*asynq.Task, error) {

	payload := ConversionTaskPayload{
		ConversionId: conversionId,
		Demo:         demo,
	}

	fmt.Println("creating payload..", payload)

	var buffer bytes.Buffer

	if err := json.NewEncoder(&buffer).Encode(payload); err != nil {
		return nil, err
	}

	return asynq.NewTask(TypeConvertPlaylist, buffer.Bytes()), nil
}

func NewSyncWatchTask(conversionId string, startTime time.Time) *asynq.Task {
	return asynq.NewTask(TypeSyncWatch, []byte(conversionId), asynq.ProcessAt(startTime))
}

func NewTestTask(conversionId string) *asynq.Task {
	return asynq.NewTask(TypeTestTask, []byte(conversionId))
}

func EnqueuePlaylistConversionTask(client *asynq.Client, conversionId string, demo bool) (*asynq.TaskInfo, error) {
	task, err := NewPlaylistConversionTask(conversionId, demo)
	if err != nil {
		return nil, err
	}

	return client.Enqueue(task)
}
