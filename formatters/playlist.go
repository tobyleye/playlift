package formatters

import (
	"github.com/zmb3/spotify/v2"
	"google.golang.org/api/youtube/v3"
)

type FormattedPlaylist struct {
	Url         string   `json:"url"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	TotalTracks int      `json:"total_tracks"`
	Images      []string `json:"images"`
}

type PlaylistListResult struct {
	Total     int                 `json:"total"`
	Playlists []FormattedPlaylist `json:"playlists"`
}

func FormatSpotifyPlaylists(playlists *spotify.SimplePlaylistPage) PlaylistListResult {
	parsedPlaylists := []FormattedPlaylist{}
	for _, p := range playlists.Playlists {
		images := []string{}
		for _, i := range p.Images {
			images = append(images, i.URL)
		}
		playlist := FormattedPlaylist{
			Url:         p.ExternalURLs["spotify"],
			Name:        p.Name,
			Description: p.Description,
			TotalTracks: int(p.Tracks.Total),
			Images:      images,
		}

		parsedPlaylists = append(parsedPlaylists, playlist)
	}

	return PlaylistListResult{
		Total:     int(playlists.Total),
		Playlists: parsedPlaylists,
	}
}

func FormatYoutubePlaylists(playlistsResponse *youtube.PlaylistListResponse) PlaylistListResult {
	if playlistsResponse == nil {
		return PlaylistListResult{}
	}
	playlists := []FormattedPlaylist{}
	for _, playlist := range playlistsResponse.Items {
		var images []string
		if playlist.Snippet.Thumbnails != nil {
			if playlist.Snippet.Thumbnails.Default != nil {
				images = append(images, playlist.Snippet.Thumbnails.Default.Url)
			}
			if playlist.Snippet.Thumbnails.Medium != nil {
				images = append(images, playlist.Snippet.Thumbnails.Medium.Url)
			}
			if playlist.Snippet.Thumbnails.High != nil {
				images = append(images, playlist.Snippet.Thumbnails.High.Url)
			}
		}

		formattedPlaylist := FormattedPlaylist{
			Url:         "https://www.youtube.com/playlist?list=" + playlist.Id,
			Name:        playlist.Snippet.Title,
			Description: playlist.Snippet.Description,
			TotalTracks: int(playlist.ContentDetails.ItemCount),
			Images:      images,
		}

		playlists = append(playlists, formattedPlaylist)
	}

	return PlaylistListResult{
		Total:     int(playlistsResponse.PageInfo.TotalResults),
		Playlists: playlists,
	}
}
