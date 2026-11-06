package core

import (
	"net/http"

	"github.com/tobyleye/go-ytmusicapi"
	"github.com/tobyleye/playlift/config"
	"gorm.io/gorm"
)

type PublicYTMusicClient struct {
	client        *http.Client
	authenticated bool
}

func (client *PublicYTMusicClient) GetPlaylistById(playlistId string) (ytmusicapi.PlaylistDetails, error) {

	playlists, err := ytmusicapi.FetchPlaylist(client.client, playlistId)
	return playlists, err
}

func NewPublicYTMusicClient(db *gorm.DB) *PublicYTMusicClient {
	client, _ := config.CreateSystemYoutubeClient(db)

	return &PublicYTMusicClient{
		client:        client,
		authenticated: false,
	}

}
