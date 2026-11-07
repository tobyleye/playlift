package clients

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/tobyleye/playlift/formatters"
	"github.com/tobyleye/playlift/types"
	"github.com/tobyleye/playlift/utils"
	"github.com/zmb3/spotify/v2"
)

type SpotifyConverterClient struct {
	*spotify.Client
	spotifyUserId string
	context       context.Context
}

func (c SpotifyConverterClient) GetPlaylistDetails(playlistId string) (types.PlaylistDetails, error) {

	if playlistId == "LM" {
		return types.PlaylistDetails{
			Title:       "Liked Music",
			Link:        "https://open.spotify.com/collection/tracks",
			TotalTracks: -1,
		}, nil
	}

	playlist, err := c.Client.GetPlaylist(c.context, spotify.ID(playlistId))
	if err != nil {
		return types.PlaylistDetails{}, err

	}

	return types.PlaylistDetails{
		Title:       playlist.Name,
		Link:        playlist.ExternalURLs["spotify"],
		TotalTracks: int(playlist.Tracks.Total),
	}, nil
}

func (c SpotifyConverterClient) GetPlaylistTracks(playlistId string, count interface{}) ([]types.Track, error) {
	realCount := count.(int)

	fmt.Println("realCount..", realCount)

	// Implementation for fetching playlist tracks from YouTube
	var playlistTracks []*spotify.FullTrack
	// options := spotify.RequestOption() // Spotify API allows a maximum of 100 items per request, but we use 50 for better performance

	offset := 0
	const MAX_LIMIT = 50

	for {
		var limit int

		hasNext := false
		totalFetched := len(playlistTracks)
		remaining := realCount - totalFetched

		if realCount > 0 {
			limit = utils.Min(remaining, MAX_LIMIT)
		} else {
			limit = MAX_LIMIT // default limit to use
		}

		fmt.Printf("fetching playlist.. limit=%d\n", limit)

		if playlistId == "LM" {
			savedTracks, err := c.Client.CurrentUsersTracks(c.context, spotify.Limit(limit), spotify.Offset(offset))
			if err != nil {
				return nil, err
			}

			for _, track := range savedTracks.Tracks {
				playlistTracks = append(playlistTracks, &track.FullTrack)
			}
			hasNext = savedTracks.Next != ""
		} else {
			tracks, err := c.Client.GetPlaylistItems(c.context, spotify.ID(playlistId),
				spotify.Limit(limit), spotify.Offset(offset),
			)

			if err != nil {
				return nil, err
			}

			for _, track := range tracks.Items {
				playlistTracks = append(playlistTracks, track.Track.Track)

			}
			hasNext = tracks.Next != ""

		}

		if !hasNext || (realCount > 0 && remaining > 0) {
			break
		}

		offset += limit

	}

	formattedTracks := formatters.FormatSpotifyTracks(playlistTracks)

	return formattedTracks, nil

}

func (c SpotifyConverterClient) SearchTrack(title string, artists []string) (*types.Track, error) {
	// Implementation for searching a track on Spotify
	query := fmt.Sprintf("track:%s artist:%s", title, strings.Join(artists, ", "))
	result, err := c.Client.Search(c.context, query, spotify.SearchTypeTrack, spotify.Limit(1))
	if err != nil {
		return nil, err
	}
	if result.Tracks.Total == 0 {
		return nil, nil // No result found
	}

	bestMatch := result.Tracks.Tracks[0]

	foundTrack := formatters.FormatSpotifyTrack(&bestMatch)

	return &foundTrack, nil
}

func (c SpotifyConverterClient) CreatePlaylist(playlistTitle string, playlistDescription string, tracks []string) (string, string, error) {
	// Implementation for creating a playlist on Spotify
	createdPlaylist, err := c.Client.CreatePlaylistForUser(c.context, c.spotifyUserId, playlistTitle, playlistDescription, false, false)

	if err != nil {
		return "", "", err
	}

	for i := 0; i < len(tracks); i += 100 {
		remainingTracks := utils.Min(100, len(tracks[i:]))

		batch := tracks[i : i+remainingTracks]

		spotifyTracks := []spotify.ID{}

		for _, t := range batch {
			spotifyTracks = append(spotifyTracks, spotify.ID(t))
		}

		_, err = c.Client.AddTracksToPlaylist(c.context, createdPlaylist.ID, spotifyTracks...)

		if err != nil {
			log.Println("error adding tracks to spotify playlist:", err)
			return "", "", err

		}

	}

	return createdPlaylist.ExternalURLs["spotify"], createdPlaylist.ID.String(), nil

}

func (c SpotifyConverterClient) AddTracksToPlaylist(playlistId string, tracks []string) error {
	if len(tracks) == 0 {
		return nil
	}

	for i := 0; i < len(tracks); i += 100 {
		remainingTracks := utils.Min(100, len(tracks[i:]))
		batch := tracks[i : i+remainingTracks]

		spotifyTracks := make([]spotify.ID, 0, len(batch))
		for _, t := range batch {
			spotifyTracks = append(spotifyTracks, spotify.ID(t))
		}

		_, err := c.Client.AddTracksToPlaylist(c.context, spotify.ID(playlistId), spotifyTracks...)
		if err != nil {
			return err
		}
	}

	return nil
}

func NewSpotifyClient(client *spotify.Client, spotifyUserId string) ConverterClient {
	return &SpotifyConverterClient{Client: client, context: context.Background(), spotifyUserId: spotifyUserId}
}
