package cronjobs

import (
	"log"
	"time"

	"github.com/go-co-op/gocron/v2"
	"github.com/hibiken/asynq"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/tasks"
	"gorm.io/gorm"
)

func StartCronJobs(db *gorm.DB, asynqClient *asynq.Client) error {
	s, err := gocron.NewScheduler()
	if err != nil {
		return err
	}

	startWatch := func() {
		watchedConversions := []models.ConversionWatch{}
		err = db.Order("created_at ASC").Find(&watchedConversions).Error
		if err != nil {
			log.Println("error fetching conversion watches for cron job", err)
			return
		}
		for _, conversion := range watchedConversions {
			task := tasks.NewSyncWatchTask(conversion.ConversionId, time.Now())
			if _, err := asynqClient.Enqueue(task); err != nil {
				log.Println("error enqueuing watch sync task", conversion.ConversionId, err)
			}
		}
	}

	_, err = s.NewJob(
		gocron.DurationJob(
			10*time.Minute,
		),
		gocron.NewTask(startWatch),
	)

	if err != nil {
		return err
	}

	s.Start()
	log.Println("watch sync cron started")

	return nil
}
