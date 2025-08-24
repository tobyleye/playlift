package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/valkey-io/valkey-go"
	"github.com/zmb3/spotify/v2"

	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/core/converter/clients"
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

// func searchSpotifyTrackOnYoutube(ctx context.Context, cache valkey.Client, youtubeClient *http.Client, track *types.Track) (*types.Track, error) {

// 	var foundTrack = types.Track{}

// 	key := fmt.Sprintf("spotify(%s)-youtube", track.ID)
// 	res := cache.Do(ctx, cache.B().Get().Key(key).Build())
// 	// .Scan(&foundTrack)

// 	if res.Error() != nil {
// 		fmt.Println("error fetching track from cache:", res.Error())
// 	}
// 	if foundTrack.ID != "" {
// 		fmt.Println("found track in cache:", foundTrack.ID)
// 		return &foundTrack, nil
// 	}

// 	searchResult, err := ytmusicapi.SearchOne(youtubeClient, types.SearchQuery{
// 		Title:   track.Title,
// 		Artists: track.Artists,
// 		Type:    "audio",
// 	})
// 	if err != nil {
// 		return nil, err
// 	}

// 	if searchResult.VideoId == "" {
// 		return nil, nil // No result found
// 	}

// 	foundTrack = formatters.FormatYoutubeTrack(&searchResult)

// 	// save track
// 	foundTrackString, _ := foundTrack.MarshalBinary()
// 	err = cache.Do(ctx, cache.B().Set().Key(key).Value(string(foundTrackString)).Build()).Error()
// 	if err != nil {
// 		fmt.Println("error saving track..", err)
// 	}

// 	return &foundTrack, nil
// }

// func searchYoutubeTrackOnSpotify(ctx context.Context, cache valkey.Client, spotifyClient *spotify.Client, track *types.Track) (*types.Track, error) {
// 	var foundTrack = types.Track{}

// 	key := fmt.Sprintf("youtube(%s)-spotify", track.ID)
// 	err := cache.Get(ctx, key).Scan(&foundTrack)
// 	if err != nil {
// 		fmt.Println("error fetching track from cache:", err)
// 	}

// 	if foundTrack.ID != "" {
// 		fmt.Println("found track in cache:", foundTrack.ID)
// 		return &foundTrack, nil
// 	}

// 	query := fmt.Sprintf("track:%s artist:%s", track.Title, strings.Join(track.Artists, ", "))
// 	result, err := spotifyClient.Search(ctx, query, spotify.SearchTypeTrack, spotify.Limit(1))
// 	if err != nil {
// 		return nil, err
// 	}

// 	if result.Tracks.Total == 0 {
// 		return nil, nil // No result found
// 	}

// 	bestMatch := result.Tracks.Tracks[0]

// 	foundTrack = formatters.FormatSpotifyTrack(&bestMatch)

// 	err = cache.Set(ctx, key, foundTrack, 0).Err()
// 	if err != nil {
// 		fmt.Println("error saving track..", err)
// 	}

// 	return &foundTrack, nil
// }

func searchTrack(ctx context.Context, cache valkey.Client, sourcePlatform string, track *types.Track, client clients.PlatformClient) (*types.Track, error) {
	var cacheKey string
	if sourcePlatform == SPOTIFY {
		cacheKey = fmt.Sprintf("spotify(%s)-youtube", track.ID)
	} else if sourcePlatform == YOUTUBE_MUSIC {
		cacheKey = fmt.Sprintf("youtube(%s)-spotify", track.ID)
	}

	var foundTrack = types.Track{}

	trackBytes, err := cache.Do(ctx, cache.B().Get().Key(cacheKey).Build()).AsBytes()

	if err != nil {
		fmt.Println("error fetching track from cache:", err)
	}

	if trackBytes != nil {
		foundTrack.UnmarshalBinary(trackBytes)
	}

	if foundTrack.ID != "" {
		fmt.Println("found track in cache:", foundTrack.ID)
		return &foundTrack, nil
	}

	result, err := client.SearchTrack(track.Title, track.Artists)

	if err != nil {
		return nil, err
	}

	if result != nil {
		resultStr, _ := json.Marshal(result)
		err = cache.Do(ctx, cache.B().Set().Key(cacheKey).Value(string(resultStr)).Build()).Error()
		if err != nil {
			fmt.Println("error saving track..", err)
		}

	}

	return result, nil

}

type ConversionState struct {
	ConversionID        string                                  `json:"conversion_id"`
	PlaylistLink        string                                  `json:"playlist_link"`
	PlaylistTitle       string                                  `json:"playlist_title"`
	TotalTracks         int                                     `json:"total_tracks"`
	PlaylistTracks      []types.Track                           `json:"playlist_tracks"`
	Status              string                                  `json:"status"`
	Result              map[string]models.TrackConversionResult `json:"result"`
	CreatedPlaylistLink string                                  `json:"created_playlist_link"`
}

func (s *ConversionState) Save(ctx context.Context, cache valkey.Client) error {
	fmt.Println("saving conversion with id..", s.ConversionID)
	str, _ := s.MarshalBinary()
	return cache.Do(ctx, cache.B().Set().Key(fmt.Sprintf("conversion:%s", s.ConversionID)).Value(string(str)).Build()).Error()
}

func (s *ConversionState) saveToDb(db *gorm.DB, timeTaken float64) {

	fmt.Println("saving all tracks to db...", len(s.PlaylistTracks), s.Status, s.PlaylistTitle, s.TotalTracks)
	conversion := models.PlaylistConversion{
		ConversionID:        s.ConversionID,
		Status:              s.Status,
		Result:              s.Result,
		CreatedPlaylistLink: s.CreatedPlaylistLink,
		TimeTaken:           float64(timeTaken),
	}

	if err := db.Where(models.PlaylistConversion{ConversionID: s.ConversionID}).Updates(conversion).Error; err != nil {
		log.Println("error saving conversion state to db:", err)
	}
}

func (s *ConversionState) MarshalBinary() ([]byte, error) {
	return json.Marshal(s) // Marshal the struct into JSON bytes
}

func (s *ConversionState) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, s) // Unmarshal the JSON bytes into the struct
}

func runSingleConversion(db *gorm.DB, cache valkey.Client, conversion *models.PlaylistConversion) error {

	conversionState := ConversionState{
		ConversionID: conversion.ConversionID,
	}

	startTime := time.Now()

	user := &models.User{}
	db.First(user, "user_id = ?", conversion.UserId)

	// handle single conversion
	userId := conversion.UserId

	// create context
	ctx := context.Background()

	err := func() error {

		youtubeClient, spotifyClient, err := createClientsForUser(db, userId)
		if err != nil {
			return err
		}

		var sourceClient clients.PlatformClient
		var destinationClient clients.PlatformClient

		if conversion.SourcePlatform == SPOTIFY {
			sourceClient = clients.NewSpotifyClient(spotifyClient, user.SpotifyId)
			destinationClient = clients.NewYoutubeConverterClient(youtubeClient)
		} else if conversion.SourcePlatform == YOUTUBE_MUSIC {
			destinationClient = clients.NewSpotifyClient(spotifyClient, user.SpotifyId)
			sourceClient = clients.NewYoutubeConverterClient(youtubeClient)
		}

		// get playlist details
		playlistDetails, err := sourceClient.GetPlaylistDetails(conversion.PlaylistId)
		if err != nil {
			return err
		}

		conversion.PlaylistTitle = playlistDetails.Title
		conversion.PlaylistLink = playlistDetails.Link
		conversion.TotalTracks = playlistDetails.TotalTracks

		playlistTracks, err := sourceClient.GetPlaylistTracks(conversion.PlaylistId)
		if err != nil {
			return err
		}

		conversion.PlaylistTracks = playlistTracks
		if conversion.TotalTracks == 0 {
			conversion.TotalTracks = len(playlistTracks)
		}

		db.Save(conversion)

		destinationTracksId := []string{}

		conversionResults := map[string]models.TrackConversionResult{}

		totalSearchWorkers := 10
		trackQueue := make(chan *types.Track)
		workersDone := make(chan bool)
		saved := make(chan bool)

		type TrackConversionResultWithSourceId struct {
			models.TrackConversionResult
			trackId string
		}

		convertedTracksResult := make(chan TrackConversionResultWithSourceId, totalSearchWorkers)

		// channel to collect results from workers
		go func() {
			// save data after 5 records have been entered
			buffer := 0
			for result := range convertedTracksResult {

				conversionResults[result.trackId] = result.TrackConversionResult
				if result.Data != "" {

					destinationTracksId = append(destinationTracksId, result.Data)
				}
				buffer++
				if buffer >= 5 {
					conversionState.Result = conversionResults
					conversionState.Save(ctx, cache)
					buffer = 0

				}
			}

			conversionState.Result = conversionResults
			conversionState.Save(ctx, cache)

			saved <- true
		}()

		// start workers to search for tracks on youtube music
		go func() {
			for _, track := range playlistTracks {
				trackQueue <- &track
			}
			close(trackQueue)
		}()

		// start workers to search for tracks on youtube music
		for range totalSearchWorkers {
			go func() {
				for track := range trackQueue {
					trackConversionResult := TrackConversionResultWithSourceId{
						TrackConversionResult: models.TrackConversionResult{},
						trackId:               track.ID,
					}

					searchResult, err := searchTrack(ctx, cache, conversion.SourcePlatform,
						track, destinationClient)

					if err != nil {
						log.Println("error searching for track on youtube music:", err)
						trackConversionResult.Error = "server error"

					} else if searchResult == nil {
						log.Println("no result found for track:", track.Title)
						trackConversionResult.Error = "Not found"

					} else {
						log.Println("found track on youtube music:", searchResult.Link)
						trackConversionResult.Data = searchResult.ID
					}

					convertedTracksResult <- trackConversionResult

				}
				workersDone <- true

			}()

		}

		for range totalSearchWorkers {
			<-workersDone
		}

		close(convertedTracksResult)

		// fmt.Println("ALL WORKERS DONE!!!..")

		<-saved

		// fmt.Println("DONE SAVING!!!..")

		if len(destinationTracksId) == 0 {
			return nil
		}

		playlistTitle := func() string {
			if conversion.SourcePlatform == SPOTIFY {
				return fmt.Sprintf("Spotify/%s", playlistDetails.Title)
			} else if conversion.SourcePlatform == YOUTUBE_MUSIC {
				return fmt.Sprintf("YouTube Music/%s", playlistDetails.Title)
			}
			return ""
		}()

		createdPlaylistLink, err := destinationClient.CreatePlaylist(
			playlistTitle,
			"",
			destinationTracksId,
		)

		if err != nil {
			return err
		}

		conversionState.Result = conversionResults
		conversionState.CreatedPlaylistLink = createdPlaylistLink
		conversionState.Status = "completed"
		conversionState.Save(ctx, cache)

		return nil
	}()

	timeTaken := time.Since(startTime).Seconds()

	if err != nil {
		log.Println("error running conversion:", err)

		conversionState.Status = "failed"
		// conversion.Status = "failed"
		// conversion.TimeTaken = timeTaken
		// db.Save(conversion)

	} else {
		log.Println("conversion completed successfully for", conversion.PlaylistId)
		// conversion.TimeTaken = timeTaken
		// db.Save(conversion)
	}

	// time.Sleep(2 * time.Minute)
	conversionState.saveToDb(db, timeTaken)

	return nil

}

func startConversions(db *gorm.DB, cache valkey.Client, conversions ...*models.PlaylistConversion) {
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
