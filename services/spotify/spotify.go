package spotify_service

import (
	"context"
	"fmt"
	"strings"

	"github.com/tobyleye/playlift/types"
	"github.com/tobyleye/playlift/utils"
	"github.com/zmb3/spotify/v2"
)

func getArtists(artists []spotify.SimpleArtist) []string {
	var artistNames []string
	for _, artist := range artists {
		artistNames = append(artistNames, artist.Name)
	}
	return artistNames
}

func SearchSpotify(spotifyClient *spotify.Client, ctx context.Context, searchQuery types.SearchQuery) (types.SimpleTrack, error) {

	query := fmt.Sprintf("track:%s artist:%s", searchQuery.Title, strings.Join(searchQuery.Artists, ", "))

	searchResult, err := spotifyClient.Search(ctx, query, spotify.SearchTypeTrack)
	if err != nil {
		return types.SimpleTrack{}, err
	}

	tracks := searchResult.Tracks.Tracks

	if len(tracks) > 0 {
		bestMatch := tracks[0]

		return types.SimpleTrack{
			Name:    bestMatch.Name,
			Artists: getArtists(bestMatch.Artists),
			Link:    bestMatch.ExternalURLs["spotify"],
		}, nil
	}

	return types.SimpleTrack{}, nil

}

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
