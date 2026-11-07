package converter

import (
	"fmt"
	"net/http"

	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/core/converter/clients"
	"github.com/zmb3/spotify/v2"
	"gorm.io/gorm"
)

func CreateConverterClient(db *gorm.DB, userId string, platform string, isDemo bool, ytmusicClient *http.Client, spotifyClient *spotify.Client) (clients.ConverterClient, error) {
	if platform == "spotify" {
		var client *spotify.Client
		var err error

		if isDemo {
			client = spotifyClient
		} else {
			client, err = config.CreateUserSpotifyClient(db, userId)
		}

		if err != nil {
			return nil, err
		}

		spotifyClient := clients.NewSpotifyClient(client, "")
		return spotifyClient, nil

	} else if platform == "youtube_music" {
		var client *http.Client
		var err error

		if isDemo {
			client = ytmusicClient
		} else {
			client, err = config.CreateYoutubeClientForUser(db, userId)
		}

		if err != nil {
			return nil, err
		}

		return clients.NewYoutubeConverterClient(client), nil
	}

	return nil, fmt.Errorf("platform %s isn't recognized", platform)
}
