package formatters

import (
	"github.com/tobyleye/go-ytmusicapi"
	"github.com/zmb3/spotify/v2"
)

type Track struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Artists   []string `json:"artists"`
	Thumbnail string   `json:"thumbnail"`
	Link      string   `json:"link"`
	Album     string   `json:"album"`
}

type PlaylistPreview struct {
	Name        string  `json:"name"`
	Tracks      []Track `json:"tracks"`
	TotalTracks int     `json:"total_tracks"`
	Cover       string  `json:"cover"`
}

var TOTAL_TRACKS_FOR_PREVIEW = 10

func FormatSpotifyPlaylistForPreview(playlist *spotify.FullPlaylist) PlaylistPreview {
	tracks := []Track{}
	for _, t := range playlist.Tracks.Tracks[0:TOTAL_TRACKS_FOR_PREVIEW] {
		tracks = append(tracks, Track{
			ID:    t.Track.ID.String(),
			Title: t.Track.Name,
			// Thumbnail: Map(t.Track.Album.Images, func(e interface{}, i int) interface{} {}),
			Thumbnail: "",
			Artists:   []string{t.Track.Artists[0].Name},
		})
	}
	pickedCover := ""
	if len(playlist.Images) == 3 {
		// pick the middle quality
		pickedCover = playlist.Images[1].URL
	} else {
		// pick last one
		pickedCover = playlist.Images[len(playlist.Images)-1].URL
	}

	return PlaylistPreview{
		Name:        playlist.Name,
		TotalTracks: int(playlist.Tracks.Total),
		Tracks:      tracks,
		Cover:       pickedCover,
	}
}

func FormatYoutubeMusicPlaylistForPreview(playlist ytmusicapi.PlaylistDetails) PlaylistPreview {
	tracks := []Track{}

	pickedCover := ""

	if len(playlist.Thumbnails) == 3 {
		// pick the middle quality
		pickedCover = playlist.Thumbnails[2]
	} else {
		// pick last one
		pickedCover = playlist.Thumbnails[len(playlist.Thumbnails)-1]
	}

	for _, t := range playlist.PlaylistTracks[0:TOTAL_TRACKS_FOR_PREVIEW] {
		tracks = append(tracks, Track{
			ID:        t.VideoId,
			Title:     t.Title,
			Thumbnail: "",
			Artists:   t.Artists,
		})
	}

	return PlaylistPreview{
		Name:        playlist.Title,
		TotalTracks: playlist.TotalTracks,
		Tracks:      tracks,
		Cover:       pickedCover,
	}
}
