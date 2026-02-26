package cronjobs

import (
	"fmt"
	"log"
	"time"

	"github.com/go-co-op/gocron/v2"
	"github.com/tobyleye/playlift/models"
	"gorm.io/gorm"
)

func StartCronJobs(db *gorm.DB) error {
	s, err := gocron.NewScheduler()
	if err != nil {
		log.Fatal("error starting cron jobs", err)
	}

	startWatch := func() {
		conversions := []models.ConversionWatch{}
		err = db.Order("created_at ASC").Find(&conversions).Error
		if err != nil {
			log.Println("error fetching conversion watches for cron job", err)
			return
		}
		for _, conversion := range conversions {
			fmt.Println("starting conversion..", conversion.ConversionId, conversion.CreatedAt)

			// tasks.NewSyncWatchTask(conversion.ConversionId, )
		}
	}

	job1, err := s.NewJob(
		gocron.DurationJob(
			10*time.Second,
		),
		gocron.NewTask(func() {
			fmt.Println("running job 1 handler")
		}),
	)

	if err != nil {
		fmt.Println("error creating job 1", err)
	}

	job2, err := s.NewJob(
		gocron.DurationJob(
			24*time.Second,
		),
		gocron.NewTask(startWatch),
	)

	if err != nil {
		fmt.Println("error creating job 2", err)
	}

	fmt.Println("job..", job1.ID())
	fmt.Println("job..", job2.ID())

	s.Start()

	return nil
}
