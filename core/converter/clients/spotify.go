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

type SpotifyClient struct {
	*spotify.Client
	spotifyUserId string
	context       context.Context
}

func (c SpotifyClient) GetPlaylistDetails(playlistId string) (types.PlaylistDetails, error) {

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

func (c SpotifyClient) GetPlaylistTracks(playlistId string) ([]types.Track, error) {
	// Implementation for fetching playlist tracks from YouTube
	var playlistTracks []*spotify.FullTrack
	// options := spotify.RequestOption() // Spotify API allows a maximum of 100 items per request, but we use 50 for better performance

	offset := 0
	limit := 50

	for {
		hasNext := false
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

		if !hasNext {
			break
		}

		offset += limit

	}

	formattedTracks := formatters.FormatSpotifyTracks(playlistTracks)

	return formattedTracks, nil

}

func (c SpotifyClient) SearchTrack(title string, artists []string) (*types.Track, error) {
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

func (c SpotifyClient) CreatePlaylist(playlistTitle string, playlistDescription string, tracks []string) (string, error) {
	// Implementation for creating a playlist on Spotify
	createdPlaylist, err := c.Client.CreatePlaylistForUser(c.context, c.spotifyUserId, playlistTitle, playlistDescription, false, false)

	if err != nil {
		return "", err
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
			return "", err

		}

	}

	return createdPlaylist.ExternalURLs["spotify"], nil

}

func NewSpotifyClient(client *spotify.Client, spotifyUserId string) PlatformClient {
	return &SpotifyClient{Client: client, context: context.Background(), spotifyUserId: spotifyUserId}
}
