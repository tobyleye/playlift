package spotify_service

import (
	"context"

	"github.com/tobyleye/playlift/types"
	"github.com/tobyleye/playlift/utils"
	"github.com/zmb3/spotify/v2"
)

func GetUserPlaylists(ctx context.Context, client *spotify.Client, page int) (types.SpotifyPlaylistPage, error) {

	page = utils.Max(1, page)

	limit := 50
	offset := (page - 1) * limit

	playlists, err := client.CurrentUsersPlaylists(ctx, spotify.Limit(limit), spotify.Offset(offset))

	if err != nil {
		return types.SpotifyPlaylistPage{}, err
	}

	var nextPage int = -1

	if playlists.Next != "" {
		nextPage = page + 1
	}

	playlistPage := types.SpotifyPlaylistPage{
		TotalCount: int(playlists.Total),
		Playlists:  []types.SimplePlaylistPageItem{},
		NextPage:   nextPage,
	}

	for _, p := range playlists.Playlists {
		images := []string{}
		for _, i := range p.Images {
			images = append(images, i.URL)
		}
		playlist := types.SimplePlaylistPageItem{

			Url:         p.ExternalURLs["spotify"],
			Title:       p.Name,
			Description: p.Description,
			TotalTracks: int(p.Tracks.Total),
			Thumbnails:  images,
			PlaylistId:  string(p.ID),
		}

		playlistPage.Playlists = append(playlistPage.Playlists, playlist)
	}

	return playlistPage, nil

}
