package watcher

import (
	"fmt"

	"github.com/tobyleye/playlift/core/converter"
	"github.com/tobyleye/playlift/db"
)

func HandleWatch(conversionId string, userId string, db *db.DB) error {
	fmt.Println(conversionId, userId)
	youtubeClient, spotifyClient, err := converter.CreateClientsForUser(db, userId)

	if err != nil {
		fmt.Println("err...", err)
	}

	fmt.Println("youtube client...", youtubeClient)
	fmt.Println("spotify client...", spotifyClient)

	return nil
}
