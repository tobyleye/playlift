package spotify_service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/types"
	"github.com/zmb3/spotify/v2"
	spotifyAuth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2/clientcredentials"
)

func getArtists(artists []spotify.SimpleArtist) []string {
	var artistNames []string
	for _, artist := range artists {
		artistNames = append(artistNames, artist.Name)
	}
	return artistNames
}

func createSimpleTrack(track *spotify.FullTrack) types.SimpleTrack {
	name := track.Name
	artist := track.Artists[0].Name
	cover := track.Album.Images[0].URL
	trackId := track.ID.String()

	simpleTrack := types.SimpleTrack{
		ID:        trackId,
		Name:      name,
		Artists:   []string{artist},
		Thumbnail: cover,
	}

	return simpleTrack
}

func loadSpotifyAlbum(client *spotify.Client, ctx context.Context, albumId string, isPreview bool) (types.SimplePlaylist, error) {
	album, err := client.GetAlbum(ctx, spotify.ID(albumId))
	if err != nil {
		return types.SimplePlaylist{}, err
	}
	totalTracks := int(album.Tracks.Total)

	// albumTracks := album.Tracks.Tracks

	playlist := types.SimplePlaylist{
		Name:   album.Name,
		Tracks: types.SimpleTracks{Total: totalTracks, Tracks: []types.SimpleTrack{}},
	}

	if isPreview {
		log.Println("is types...")
	}

	albumTracks, err := client.GetAlbumTracks(ctx, spotify.ID(albumId))

	if err == nil {
		for _, track := range albumTracks.Tracks {

			trackArtists := getArtists(track.Artists)
			// track.Album.Images[0].URL
			playlist.Tracks.Tracks = append(playlist.Tracks.Tracks, types.SimpleTrack{
				ID:        track.ID.String(),
				Name:      track.Name,
				Artists:   trackArtists,
				Thumbnail: "",
			})
		}
	}

	return playlist, nil
}

func loadSpotifyPlaylist(client *spotify.Client, ctx context.Context, playlistId string, isPreview bool) (types.SimplePlaylist, error) {
	playlist, err := client.GetPlaylist(ctx, spotify.ID(playlistId))

	if err != nil {
		return types.SimplePlaylist{}, err
	}
	totalTracks := int(playlist.Tracks.Total)

	tracks := types.SimpleTracks{
		Total:  totalTracks,
		Tracks: []types.SimpleTrack{},
	}

	if isPreview {
		for _, each := range playlist.Tracks.Tracks {

			track := each.Track

			simpleTrack := createSimpleTrack(&track)

			tracks.Tracks = append(tracks.Tracks, simpleTrack)

		}

	} else {
		playlistItems, err := client.GetPlaylistItems(ctx, spotify.ID(playlistId))
		if err == nil {
			for _, item := range playlistItems.Items {
				track := item.Track.Track

				simpleTrack := createSimpleTrack(track)

				tracks.Tracks = append(tracks.Tracks, simpleTrack)
			}
		}

	}

	return types.SimplePlaylist{
		Name:   playlist.Name,
		Tracks: tracks,
	}, nil

}

func getTrackDetails(client *spotify.Client, ctx context.Context, trackId string) (types.SimpleTrack, error) {
	track, err := client.GetTrack(ctx, spotify.ID(trackId))

	trackArtists := getArtists(track.Artists)

	simpleTrack := types.SimpleTrack{
		Name:      track.Name,
		Artists:   trackArtists,
		Thumbnail: "",
	}
	if err != nil {
		return types.SimpleTrack{}, err
	}
	return simpleTrack, nil
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

func GetSpotifyMusicInfo(spotifyClient *spotify.Client, ctx context.Context, resourceId string, resourceType string, isPreview bool) (interface{}, error) {
	// itemsSize := -1 // -1 means no limit
	// if isPreview {
	// 	itemsSize = 4
	// }

	fmt.Println("resource type is ", resourceType)
	fmt.Println("resource id is ", resourceId)

	if resourceType == "album" {
		album, err := loadSpotifyAlbum(spotifyClient, ctx, resourceId, isPreview)
		return album, err
	} else if resourceType == "playlist" {
		playlist, err := loadSpotifyPlaylist(spotifyClient, ctx, resourceId, isPreview)
		fmt.Printf("playlist name is %s. page is almost ready\n", playlist.Name)
		return playlist, err
	} else if resourceType == "track" {
		track, err := getTrackDetails(spotifyClient, ctx, resourceId)
		return track, err
	} else {
		return nil, fmt.Errorf("invalid resource type")
	}
}

func GetUserPlaylists(client *spotify.Client, ctx context.Context) (types.SimplePlaylistsPage, error) {
	playlists, err := client.CurrentUsersPlaylists(ctx)

	if err != nil {
		return types.SimplePlaylistsPage{}, err
	}

	playlistPage := types.SimplePlaylistsPage{
		TotalCount: int(playlists.Total),
		Playlists:  []types.SimplePlaylistPageItem{},
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

func CreatePlaylist(client *spotify.Client, ctx context.Context, userID string, playlistName string, description string, trackIds []string) (string, error) {
	collaborative := false
	public := true

	playlist, err := client.CreatePlaylistForUser(ctx, userID, playlistName, description, public, collaborative)

	if err != nil {
		return "", err
	}

	spotifyIds := []spotify.ID{}
	for _, id := range trackIds {
		spotifyId := spotify.ID(id)
		spotifyIds = append(spotifyIds, spotifyId)
	}

	_, err = client.AddTracksToPlaylist(ctx, playlist.ID, spotifyIds...)

	if err != nil {
		return "", err
	}

	return playlist.ID.String(), nil
}

func CreateSpotifyClient(ctx context.Context) *spotify.Client {
	config := clientcredentials.Config{
		ClientID:     config.SPOTIFY_CLIENT_ID,
		ClientSecret: config.SPOTIFY_CLIENT_SECRET,
		TokenURL:     spotifyAuth.TokenURL,
	}
	token, err := config.Token(ctx)
	if err != nil {
		panic(err)
	}
	fmt.Println(token)
	httpClient := spotifyAuth.New().Client(ctx, token)

	spotifyClient := spotify.New(httpClient)

	return spotifyClient
}
