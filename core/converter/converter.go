package converter

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/core/converter/clients"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/types"
	"github.com/valkey-io/valkey-go"
	"github.com/zmb3/spotify/v2"
	"gorm.io/gorm"
)

type ConversionState struct {
	ConversionID        string                                  `json:"conversion_id"`
	PlaylistLink        string                                  `json:"playlist_link"`
	Status              string                                  `json:"status"`
	Result              map[string]models.TrackConversionResult `json:"result"`
	CreatedPlaylistLink string                                  `json:"created_playlist_link"`
}

func CreateClientsForUser(db *gorm.DB, userId string) (*http.Client, *spotify.Client, error) {

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

func (s *ConversionState) Save(ctx context.Context, cache valkey.Client) error {
	str, _ := s.MarshalBinary()
	return cache.Do(ctx, cache.B().Set().Key(fmt.Sprintf("conversion:%s", s.ConversionID)).Value(string(str)).Build()).Error()
}

func (s *ConversionState) saveToDb(db *gorm.DB, timeTaken float64) {

	fmt.Println("saving all tracks to db...", s.Status)
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

func searchTrack(ctx context.Context, cache valkey.Client, sourcePlatform string, track *types.Track, client clients.PlatformClient) (*types.Track, error) {
	var cacheKey string
	if sourcePlatform == config.SPOTIFY {
		cacheKey = fmt.Sprintf("spotify(%s)-youtube", track.ID)
	} else if sourcePlatform == config.YOUTUBE_MUSIC {
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

func Convert(db *gorm.DB, cache valkey.Client, conversion *models.PlaylistConversion) error {

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

		youtubeClient, spotifyClient, err := CreateClientsForUser(db, userId)

		if err != nil {
			return err
		}

		var sourceClient clients.PlatformClient
		var destinationClient clients.PlatformClient

		if conversion.SourcePlatform == config.SPOTIFY {
			sourceClient = clients.NewSpotifyClient(spotifyClient, user.SpotifyId)
			destinationClient = clients.NewYoutubeConverterClient(youtubeClient)
		} else if conversion.SourcePlatform == config.YOUTUBE_MUSIC {
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
		if conversion.TotalTracks <= 0 {
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
			if conversion.SourcePlatform == config.SPOTIFY {
				return fmt.Sprintf("Spotify/%s", playlistDetails.Title)
			} else if conversion.SourcePlatform == config.YOUTUBE_MUSIC {
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

		// Create watch if enabled
		if conversion.EnableWatch && conversionState.CreatedPlaylistLink != "" {
			// Extract destination playlist ID from the created playlist link
		}
	}

	// time.Sleep(2 * time.Minute)
	conversionState.saveToDb(db, timeTaken)

	return nil

}
