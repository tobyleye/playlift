package clients

import (
	"net/http"

	"github.com/tobyleye/playlift/formatters"
	"github.com/tobyleye/playlift/services/ytmusicapi"
	"github.com/tobyleye/playlift/types"
)

type YoutubeConverterClient struct {
	client *http.Client
}

func (c YoutubeConverterClient) GetPlaylistDetails(playlistId string) (types.PlaylistDetails, error) {
	// Implementation for fetching playlist details from YouTube
	playlist, err := ytmusicapi.FetchPlaylist(c.client, playlistId)
	if err != nil {
		return types.PlaylistDetails{}, err
	}

	return types.PlaylistDetails{
		Title:       playlist.Title,
		Link:        playlist.Link,
		TotalTracks: len(playlist.PlaylistTracks),
	}, nil

}

func (c YoutubeConverterClient) GetPlaylistTracks(playlistId string) ([]types.Track, error) {
	// Implementation for fetching playlist tracks from YouTube
	playlistTracks, err := ytmusicapi.FetchAllPlaylistTracks(c.client, playlistId)
	if err != nil {
		return nil, err
	}

	tracks := formatters.FormatYoutubeTracks(playlistTracks.Tracks)

	return tracks, nil
}

func (c YoutubeConverterClient) SearchTrack(title string, artists []string) (*types.Track, error) {
	// Implementation for searching a track on YouTube
	searchResult, err := ytmusicapi.SearchOne(c.client, types.SearchQuery{
		Title:   title,
		Artists: artists,
		Type:    "audio",
	})
	if err != nil {
		return nil, err
	}

	formattedResult := formatters.FormatYoutubeTrack(&searchResult)
	return &formattedResult, nil
}

func (c YoutubeConverterClient) CreatePlaylist(playlistTitle string, playlistDescription string, tracks []string) (string, error) {
	// Implementation for creating a playlist on YouTube
	createdPlaylist, err := ytmusicapi.CreatePlaylist(c.client, playlistTitle,
		playlistDescription, tracks)
	if err != nil {
		return "", err
	}
	return createdPlaylist.Link, nil
}

func NewYoutubeConverterClient(client *http.Client) PlatformClient {
	return &YoutubeConverterClient{client: client}
}
