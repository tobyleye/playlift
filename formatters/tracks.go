package formatters

import (
	"github.com/tobyleye/playlift/core/ytmusicapi"
	"github.com/tobyleye/playlift/types"
	"github.com/zmb3/spotify/v2"
)

func FormatYoutubeTrack(track *ytmusicapi.Track) types.Track {
	return types.Track{
		ID:        track.VideoId,
		Title:     track.Title,
		Thumbnail: "",
		Artists:   track.Artists,
		Link:      track.Link,
	}
}

func FormatSpotifyTrack(track *spotify.FullTrack) types.Track {

	artists := []string{}
	for _, artist := range track.Artists {
		artists = append(artists, artist.Name)
	}
	return types.Track{
		ID:        string(track.ID),
		Title:     track.Name,
		Artists:   artists,
		Thumbnail: "",
		Link:      track.ExternalURLs["spotify"],
	}

}

func FormatYoutubeTracks(tracks []ytmusicapi.Track) []types.Track {
	formattedTracks := make([]types.Track, len(tracks))
	for i, track := range tracks {
		formattedTracks[i] = FormatYoutubeTrack(&track)
	}
	return formattedTracks
}

func FormatSpotifyTracks(tracks []*spotify.FullTrack) []types.Track {
	formattedTracks := make([]types.Track, len(tracks))
	for i, track := range tracks {
		formattedTracks[i] = FormatSpotifyTrack(track)
	}
	return formattedTracks
}
