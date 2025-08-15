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
	"github.com/redis/go-redis/v9"
	"github.com/zmb3/spotify/v2"

	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/formatters"
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

var LIKED_PLAYLIST_ID = "LM" // Liked music playlist ID is always "LM"

func getAllSpotifyPlaylistTracks(spotifyClient *spotify.Client, ctx context.Context, playlistId string) ([]*spotify.FullTrack, error) {
	var playlistTracks []*spotify.FullTrack
	// options := spotify.RequestOption() // Spotify API allows a maximum of 100 items per request, but we use 50 for better performance

	offset := 0
	limit := 50

	for {
		hasNext := false
		if playlistId == LIKED_PLAYLIST_ID {
			savedTracks, err := spotifyClient.CurrentUsersTracks(ctx, spotify.Limit(limit), spotify.Offset(offset))
			if err != nil {
				return nil, err
			}

			for _, track := range savedTracks.Tracks {
				playlistTracks = append(playlistTracks, &track.FullTrack)
			}

			hasNext = savedTracks.Next != ""
		} else {
			tracks, err := spotifyClient.GetPlaylistItems(ctx, spotify.ID(playlistId),
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

		if hasNext == false {
			break
		}

		offset += limit

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

func searchSpotifyTrackOnYoutube(ctx context.Context, cache *redis.Client, youtubeClient *http.Client, track *types.Track) (*types.Track, error) {

	var foundTrack = types.Track{}

	key := fmt.Sprintf("spotify(%s)-youtube", track.ID)
	err := cache.Get(ctx, key).Scan(&foundTrack)
	if err != nil {
		fmt.Println("error fetching track from cache:", err)
	}
	if foundTrack.ID != "" {
		fmt.Println("found track in cache:", foundTrack.ID)
		return &foundTrack, nil
	}

	searchResult, err := ytmusicapi.SearchOne(youtubeClient, types.SearchQuery{
		Title:   track.Title,
		Artists: track.Artists,
		Type:    "audio",
	})
	if err != nil {
		return nil, err
	}

	if searchResult.VideoId == "" {
		return nil, nil // No result found
	}

	foundTrack = formatters.FormatYoutubeTrack(&searchResult)

	// save track
	err = cache.Set(ctx, key, foundTrack, 0).Err()
	if err != nil {
		fmt.Println("error saving track..", err)
	}

	return &foundTrack, nil
}

func searchYoutubeTrackOnSpotify(ctx context.Context, cache *redis.Client, spotifyClient *spotify.Client, track *types.Track) (*types.Track, error) {
	var foundTrack = types.Track{}

	key := fmt.Sprintf("youtube(%s)-spotify", track.ID)
	err := cache.Get(ctx, key).Scan(&foundTrack)
	if err != nil {
		fmt.Println("error fetching track from cache:", err)
	}

	if foundTrack.ID != "" {
		fmt.Println("found track in cache:", foundTrack.ID)
		return &foundTrack, nil
	}

	query := fmt.Sprintf("track:%s artist:%s", track.Title, strings.Join(track.Artists, ", "))
	result, err := spotifyClient.Search(ctx, query, spotify.SearchTypeTrack, spotify.Limit(1))
	if err != nil {
		return nil, err
	}

	if result.Tracks.Total == 0 {
		return nil, nil // No result found
	}

	bestMatch := result.Tracks.Tracks[0]

	foundTrack = formatters.FormatSpotifyTrack(&bestMatch)

	err = cache.Set(ctx, key, foundTrack, 0).Err()
	if err != nil {
		fmt.Println("error saving track..", err)
	}

	return &foundTrack, nil
}

func runSingleConversion(db *gorm.DB, cache *redis.Client, conversion *models.PlaylistConversion) error {

	startTime := time.Now()

	user := &models.User{}
	db.First(user, "user_id = ?", conversion.UserId)

	// handle single conversion
	userId := conversion.UserId

	// create context
	ctx := context.Background()

	err := func() error {
		if conversion.SourcePlatform == SPOTIFY {
			log.Println("starting conversion from spotify to youtube music...", conversion.PlaylistId)
			youtubeClient, spotifyClient, err := createClientsForUser(db, userId)

			if err != nil {
				log.Println("error creating youtube/spotify client:", err)
				return err
			}

			if conversion.PlaylistId == LIKED_PLAYLIST_ID {
				// update playlist details
				conversion.PlaylistTitle = "Liked Music"
				conversion.PlaylistLink = "https://open.spotify.com/collection/tracks"
			} else {
				playlist, err := spotifyClient.GetPlaylist(ctx, spotify.ID(conversion.PlaylistId))
				if err != nil {
					log.Println("error getting playlist details:", err)
					return err
				}

				// update playlist details
				conversion.PlaylistTitle = playlist.Name
				conversion.PlaylistLink = playlist.ExternalURLs["spotify"]
				conversion.TotalTracks = int(playlist.Tracks.Total)

			}

			db.Save(conversion)

			playlistTracks, err := getAllSpotifyPlaylistTracks(spotifyClient, ctx, conversion.PlaylistId)
			totalTracks := len(playlistTracks)
			// set if the total tracks is not set
			if conversion.TotalTracks == -1 {
				conversion.TotalTracks = totalTracks
			}
			if err != nil {
				log.Println("error getting all playlist tracks client:", err)
				return err
			}

			log.Println("got a total of ", len(playlistTracks), "tracks from spotify playlist")
			formattedTracks := formatters.FormatSpotifyTracks(playlistTracks)
			conversion.PlaylistTracks = formattedTracks
			db.Save(conversion)

			youtubeTracksIds := []string{}
			conversionResults := map[string]models.TrackConversionResult{}

			for _, track := range formattedTracks {
				trackConversionResult := models.TrackConversionResult{}

				searchResult, err := searchSpotifyTrackOnYoutube(
					ctx,
					cache,
					youtubeClient,
					&track,
				)

				if err != nil {
					log.Println("error searching for track on youtube music:", err)
					trackConversionResult.Error = "server error"

				} else if searchResult == nil {
					log.Println("no result found for track:", track.Title)
					trackConversionResult.Error = "Not found"

				} else {
					log.Println("found track on youtube music:", searchResult.Link)
					trackConversionResult.Data = searchResult.ID
					youtubeTracksIds = append(youtubeTracksIds, searchResult.ID)

				}

				conversionResults[track.ID] = trackConversionResult

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

			formattedTracks := formatters.FormatYoutubeTracks(playlistTracks.Tracks)
			conversion.PlaylistTracks = formattedTracks
			db.Save(conversion)

			spotifyTracks := []spotify.ID{}
			conversionResults := map[string]models.TrackConversionResult{}

			for _, track := range formattedTracks {
				// key := "spotify:youtube:" + track.VideoId
				trackConversionResult := models.TrackConversionResult{}

				result, err := searchYoutubeTrackOnSpotify(ctx, cache, spotifyClient, &track)

				if err != nil {
					log.Printf("error searching for track %s(%s) on spotify:", track.Title, track.ID)
					trackConversionResult.Error = "server error"

				} else if result == nil {
					log.Println("no result found for track:", track.Title, track.ID, track.Artists)
					trackConversionResult.Error = "no result found"
				} else {
					spotifyTracks = append(spotifyTracks, spotify.ID(result.ID))
					trackConversionResult.Data = result.ID

				}
				conversionResults[track.ID] = trackConversionResult
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

	}()

	timeTaken := time.Since(startTime).Seconds()

	if err != nil {
		log.Println("error running conversion:", err)

		conversion.Status = "failed"
		conversion.TimeTaken = timeTaken
		db.Save(conversion)

	} else {
		log.Println("conversion completed successfully for", conversion.PlaylistId)
		conversion.TimeTaken = timeTaken
		db.Save(conversion)
	}

	return nil

}

func startConversions(db *gorm.DB, cache *redis.Client, conversions ...*models.PlaylistConversion) {
	log.Println("starting conversions for", len(conversions), "playlists")

	for _, conversion := range conversions {
		go runSingleConversion(db, cache, conversion)

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

	var conversions = []*models.PlaylistConversion{}

	for _, playlist := range body.Playlists {

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
	if err := h.Db.Create(&conversions).Error; err != nil {
		log.Println("error creating conversions: ", err)
		return c.JSON(500, errorResponse("internal server error"))
	}

	// start a goroutine to handle the conversion
	go startConversions(h.Db, h.Cache, conversions...)

	conversionIds := []string{}
	for _, conversion := range conversions {
		conversionIds = append(conversionIds, conversion.ConversionID)
	}

	return c.JSON(200, map[string]interface{}{"data": conversionIds})
}
