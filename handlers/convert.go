package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/zmb3/spotify/v2"

	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/services/ytmusicapi"
	"github.com/tobyleye/playlift/session"
	"github.com/tobyleye/playlift/types"
	"github.com/tobyleye/playlift/utils"
	"gorm.io/gorm"
)

type PlaylistDetails struct {
	Title       string `json:"title"`
	Link        string `json:"link"`
	TotalTracks int    `json:"total_tracks"`
}

type AllPlaylistDetails map[string]PlaylistDetails

func formatSpotifyPlaylistTrack(track spotify.PlaylistItem) models.PlaylistTrack {

	trackInner := track.Track.Track

	artists := []string{}
	for _, artist := range trackInner.Artists {
		artists = append(artists, artist.Name)
	}
	formattedTrack := models.PlaylistTrack{
		TrackId: string(trackInner.ID),
		Title:   trackInner.Name,
		Artists: artists,
		Album:   trackInner.Album.Name,
	}
	return formattedTrack

}

func formatSpotifyPlaylistTracks(tracks []spotify.PlaylistItem) []models.PlaylistTrack {
	formattedTracks := []models.PlaylistTrack{}

	for _, track := range tracks {
		formattedTrack := formatSpotifyPlaylistTrack(track)
		formattedTracks = append(formattedTracks, formattedTrack)
	}

	return formattedTracks
}

func formatYoutubePlaylistTracks(tracks []ytmusicapi.Track) []models.PlaylistTrack {
	formattedTracks := []models.PlaylistTrack{}

	for _, track := range tracks {
		formattedTrack := models.PlaylistTrack{
			TrackId: track.VideoId,
			Title:   track.Title,
			Artists: track.Artists,
			Album:   "",
		}
		formattedTracks = append(formattedTracks, formattedTrack)
	}
	return formattedTracks
}

func getAllPlaylistTracks(spotifyClient *spotify.Client, ctx context.Context, playlistId string) ([]spotify.PlaylistItem, error) {
	var playlistTracks []spotify.PlaylistItem
	// options := spotify.RequestOption() // Spotify API allows a maximum of 100 items per request, but we use 50 for better performance

	offset := 0
	limit := 50

	for {
		tracks, err := spotifyClient.GetPlaylistItems(ctx, spotify.ID(playlistId),
			spotify.Limit(limit), spotify.Offset(offset),
		)
		if err != nil {
			return nil, err
		}

		playlistTracks = append(playlistTracks, tracks.Items...)
		if tracks.Next == "" {
			break
		}

		offset += len(tracks.Items)

	}

	return playlistTracks, nil

}

func fetchSpotifyPlaylistsDetails(spotifyClient *spotify.Client, ctx context.Context, playlistIds []string) AllPlaylistDetails {
	// return spotifyClient.GetPlaylist()
	var result = AllPlaylistDetails{}
	for _, playlistId := range playlistIds {
		playlist, err := spotifyClient.GetPlaylist(ctx, spotify.ID(playlistId))

		if err != nil {
			log.Println("error fetching playlist details:", err)
		} else {
			playlistDetails := PlaylistDetails{
				Title:       playlist.Name,
				Link:        playlist.ExternalURLs["spotify"],
				TotalTracks: int(playlist.Tracks.Total),
			}
			result[playlistId] = playlistDetails

		}

	}
	return result
}

func fetchYoutubePlaylistsDetails(youtubeClient *http.Client, ctx context.Context, playlistIds []string) AllPlaylistDetails {
	// return spotifyClient.GetPlaylist()
	var result = AllPlaylistDetails{}
	for _, playlistId := range playlistIds {
		playlist, err := ytmusicapi.FetchPlaylist(youtubeClient, playlistId)

		if err != nil {
			log.Println("error fetching playlist details:", err)
		} else {
			playlistDetails := PlaylistDetails{
				Title:       playlist.Title,
				Link:        playlist.Link,
				TotalTracks: len(playlist.PlaylistTracks),
			}
			result[playlistId] = playlistDetails

		}

	}
	return result
}

func createClientsForUser(db *gorm.DB, userId string) (*http.Client, *spotify.Client, error) {

	spotifyClient, err := config.CreateUserSpotifyClient(db, userId)
	if err != nil {
		return nil, nil, err
	}

	// Create YouTube client
	youtubeClient, err := config.CreateYoutubeClientForUser(db, userId)
	if err != nil {
		return nil, nil, err
	}
	return youtubeClient, spotifyClient, nil

}

func createSpotifyPlaylistForUser(spotifyClient *spotify.Client, ctx context.Context, userSpotifyId, playlistTitle string, spotifyTracks []spotify.ID) (*spotify.FullPlaylist, error) {
	createdPlaylist, err := spotifyClient.CreatePlaylistForUser(ctx, userSpotifyId, playlistTitle, "", false, false)

	if err != nil {
		return nil, err
	}

	log.Println("creating spotify playlist...")

	startIndex := 0

	for {
		batchSize := utils.Min(100, len(spotifyTracks[startIndex:]))
		endIndex := startIndex + batchSize
		batch := spotifyTracks[startIndex:endIndex]

		_, err = spotifyClient.AddTracksToPlaylist(ctx, createdPlaylist.ID, batch...)

		if err != nil {
			log.Println("error adding tracks to spotify playlist:", err)
			return nil, err

		}

		if endIndex >= len(spotifyTracks) {
			break
		} else {
			startIndex = endIndex
		}
	}

	return createdPlaylist, nil
}

func startConversions(db *gorm.DB, conversions ...*models.PlaylistConversion) {
	log.Println("starting conversions for", len(conversions), "playlists")

	runSingleConversion := func(conversion *models.PlaylistConversion) error {

		user := &models.User{}
		db.First(user, "user_id = ?", conversion.UserId)

		// handle single conversion
		userId := conversion.UserId

		// create context
		ctx := context.Background()

		if conversion.SourcePlatform == SPOTIFY {
			log.Println("starting conversion from spotify to youtube music...", conversion.PlaylistId)
			youtubeClient, spotifyClient, err := createClientsForUser(db, userId)

			if err != nil {
				log.Println("error creating youtube/spotify client:", err)
				return err

			}

			playlist, err := spotifyClient.GetPlaylist(ctx, spotify.ID(conversion.PlaylistId))
			if err != nil {
				log.Println("error getting playlist details:", err)
				return err
			}

			// update playlist details
			conversion.PlaylistTitle = playlist.Name
			conversion.PlaylistLink = playlist.ExternalURLs["spotify"]
			conversion.TotalTracks = int(playlist.Tracks.Total)

			db.Save(conversion)

			playlistTracks, err := getAllPlaylistTracks(spotifyClient, ctx, conversion.PlaylistId)

			if err != nil {
				log.Println("error getting all playlist tracks client:", err)
				return err
			}

			log.Println("got a total of ", len(playlistTracks), "tracks from spotify playlist")
			formattedTracks := formatSpotifyPlaylistTracks(playlistTracks)
			conversion.PlaylistTracks = formattedTracks
			db.Save(conversion)

			youtubeTracksIds := []string{}
			conversionResults := map[string]models.TrackConversionResult{}

			for _, track := range formattedTracks {
				trackConversionResult := models.TrackConversionResult{}

				searchResult, err := ytmusicapi.SearchOne(youtubeClient, types.SearchQuery{
					Title:   track.Title,
					Artists: track.Artists,
					Type:    "audio",
				})

				if err != nil {
					log.Println("error searching for track on youtube music:", err)
					trackConversionResult.Error = "server error"

				} else if searchResult.VideoId == "" {
					log.Println("no result found for track:", track.Title)
					trackConversionResult.Error = "Not found"

				} else {
					log.Println("found track on youtube music:", searchResult.Link)
					trackConversionResult.Data = searchResult.VideoId
					youtubeTracksIds = append(youtubeTracksIds, searchResult.VideoId)

				}

				conversionResults[track.TrackId] = trackConversionResult

			}

			createdPlaylistLink := ""

			log.Println("found a total of", len(youtubeTracksIds), "tracks to add to youtube music playlist")

			if len(youtubeTracksIds) > 0 {

				playlistTitle := fmt.Sprintf("Spotify/%s", conversion.PlaylistTitle)
				playlistDescription := ""

				createdPlaylist, err := ytmusicapi.CreatePlaylist(youtubeClient, playlistTitle,
					playlistDescription, youtubeTracksIds)

				if err != nil {
					log.Println("error creating youtube music playlist:", err)
					return err
				}

				createdPlaylistLink = createdPlaylist.Link

			}

			// update the conversion status
			conversion.Result = conversionResults
			conversion.CreatedPlaylistLink = createdPlaylistLink
			conversion.Status = "completed"
			db.Save(conversion)

		} else if conversion.SourcePlatform == YOUTUBE_MUSIC {
			log.Println("starting conversion from youtube music to spotify...", conversion.PlaylistId)

			youtubeClient, spotifyClient, err := createClientsForUser(db, userId)

			if err != nil {
				log.Println("error creating youtube/spotify client:", err)
				return err
			}

			playlist, err := ytmusicapi.FetchPlaylist(youtubeClient, conversion.PlaylistId)

			if err != nil {
				log.Println("error fetching playlist details:", err)
				return err
			}

			conversion.PlaylistTitle = playlist.Title
			conversion.PlaylistLink = playlist.Link
			conversion.TotalTracks = playlist.TotalTracks

			db.Save(conversion)

			// fetch all the youtube music playlist tracks
			log.Println("fetching youtube music playlist tracks...")

			playlistTracks, err := ytmusicapi.FetchAllPlaylistTracks(youtubeClient, conversion.PlaylistId)

			if err != nil {
				log.Println("error fetching youtube playlists:", err)
				return err
			}

			formattedTracks := formatYoutubePlaylistTracks(playlistTracks.Tracks)
			conversion.PlaylistTracks = formattedTracks
			db.Save(conversion)

			spotifyTracks := []spotify.ID{}
			conversionResults := map[string]models.TrackConversionResult{}

			for _, track := range playlistTracks.Tracks {
				trackConversionResult := models.TrackConversionResult{}

				query := fmt.Sprintf("track:%s artist:%s", track.Title, strings.Join(track.Artists, ", "))
				result, err := spotifyClient.Search(ctx, query, spotify.SearchTypeTrack, spotify.Limit(1))

				if err != nil {
					log.Printf("error searching for track %s(%s) on spotify:", track.Title, track.VideoId)
					trackConversionResult.Error = "server error"

				} else if result.Tracks == nil || result.Tracks.Total == 0 {
					log.Println("no result found for track:", track.Title, track.VideoId, track.Artists)
					trackConversionResult.Error = "no result found"
				} else {
					bestResult := result.Tracks.Tracks[0]
					spotifyTracks = append(spotifyTracks, bestResult.ID)
					trackConversionResult.Data = bestResult.ID.String()

				}
				conversionResults[track.VideoId] = trackConversionResult
			}

			log.Println("found a total of", len(spotifyTracks), "tracks to add to spotify playlist")

			createdPlaylistLink := ""
			if len(spotifyTracks) > 0 {
				playlistTitle := fmt.Sprintf("Youtube Music/%s", conversion.PlaylistTitle)

				createdPlaylist, err := createSpotifyPlaylistForUser(
					spotifyClient, ctx, user.SpotifyId, playlistTitle, spotifyTracks,
				)
				createdPlaylistLink = createdPlaylist.ExternalURLs["spotify"]

				if err != nil {
					log.Println("error creating spotify playlist:", err)

					return err
				}

			}
			conversion.Status = "completed"
			conversion.Result = conversionResults
			conversion.CreatedPlaylistLink = createdPlaylistLink
			db.Save(conversion)
			log.Println("created spotify playlist:", conversion.CreatedPlaylistLink)
		}

		return nil

	}

	for _, conversion := range conversions {
		go func() {
			err := runSingleConversion(conversion)
			if err != nil {
				// handle error
				conversion.Status = "failed"
				db.Save(conversion)
				log.Println("error running conversion:", err)
			}
		}()
	}
}

func (h Handlers) Convert(c echo.Context) error {

	var body struct {
		Destination string `json:"destination"`
		Source      string `json:"source"`
		Playlists   []struct {
			ID    string `json:"id"`
			Title string `json:"title"`
		} `json:"playlists"`
	}

	requestBodyToStruct(c, &body)

	for _, playlist := range body.Playlists {
		if playlist.ID == "" || playlist.Title == "" {
			return c.JSON(http.StatusBadRequest, errorResponse("playlist id and title are required"))
		}
	}

	user, _ := session.GetUserFromSession(c)

	destinationPlatform := strings.ToLower(body.Destination)
	sourcePlatform := strings.ToLower(body.Source)

	// validate destination platform
	if !isPlatformSupported(destinationPlatform) ||
		!isPlatformSupported(sourcePlatform) {

		return c.JSON(400, errorResponse("invalid platform"))
	}

	// handle playlist requests

	// a container where all the playlist details will be stored
	// var allPlaylistsDetails AllPlaylistDetails

	// this is just to verify the playlist exists, we don't need to fetch all playlists
	// if sourcePlatform == SPOTIFY {
	// 	// get the playlist info from spotify to verify they exists
	// 	// might remove this, i don't know. it's actually needed but it might make the
	// 	// response time longer because of the number of requests we make.
	// 	// spotify makes this easy though because the playlists cant be passed in batches.
	// 	// youtube music on the other hand, the playlists have to be fetched one by one.

	// 	// musicLinkInfo, err = SpotifyService.GetSpotifyMusicInfo(h.SpotifyClient, h.Context, parsedLink.ID, parsedLink.Type, isPreview)
	// 	client, err := config.CreateUserSpotifyClient(h.Db, user.UserId)
	// 	// we don't expect an error but we check anyways
	// 	if err != nil {
	// 		log.Println("Convert-Handler: error creating spotify client:", err)
	// 		return c.JSON(401, errorResponse("unauthorized"))
	// 	}

	// 	allPlaylistsDetails = fetchSpotifyPlaylistsDetails(client, c.Request().Context(), body.Playlists)

	// } else if sourcePlatform == YOUTUBE_MUSIC {
	// 	// do the same thing for youtube music
	// 	// ytubeClient, err := config.CreateYoutubeClientForUser(h.Db, user.UserId)
	// 	client, err := config.CreateYoutubeClientForUser(h.Db, user.UserId)
	// 	if err != nil {
	// 		log.Println("Convert-Handler: error creating spotify client:", err)
	// 		return c.JSON(401, errorResponse("unauthorized"))
	// 	}

	// 	allPlaylistsDetails = fetchYoutubePlaylistsDetails(client, c.Request().Context(), body.Playlists)

	// }

	var conversions = []*models.PlaylistConversion{}

	for _, playlist := range body.Playlists {

		// playlistDetails := allPlaylistsDetails[playlistId]

		conversion := models.PlaylistConversion{
			UserId:              user.UserId,
			PlaylistId:          playlist.ID,
			PlaylistTitle:       playlist.Title,
			ConversionID:        uuid.New().String(),
			TotalTracks:         -1,
			SourcePlatform:      sourcePlatform,
			DestinationPlatform: destinationPlatform,
			Status:              "pending",
			CreatedAt:           time.Now(),
		}

		conversions = append(conversions, &conversion)
	}

	// create conversions in the database
	result := h.Db.Create(&conversions)

	if result.Error != nil {
		log.Println("error creating conversions: ", result.Error)
		return c.JSON(500, errorResponse("internal server error"))
	}

	// start a goroutine to handle the conversion
	go startConversions(h.Db, conversions...)

	conversionIds := []string{}
	for _, conversion := range conversions {
		conversionIds = append(conversionIds, conversion.ConversionID)
	}

	return c.JSON(200, map[string]interface{}{"data": conversionIds})
}
