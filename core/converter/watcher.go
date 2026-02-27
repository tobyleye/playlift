package converter

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/core/converter/clients"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/types"
	"github.com/valkey-io/valkey-go"
	"gorm.io/gorm"
)

func getNewTracks(previous []types.Track, latest []types.Track) []types.Track {
	seen := make(map[string]bool, len(previous))
	for _, track := range previous {
		if track.ID != "" {
			seen[track.ID] = true
		}
	}

	newTracks := []types.Track{}
	for _, track := range latest {
		if track.ID == "" {
			continue
		}
		if !seen[track.ID] {
			newTracks = append(newTracks, track)
		}
	}

	return newTracks
}

func SyncWatch(db *gorm.DB, cache valkey.Client, conversionId string) error {
	conversion := models.PlaylistConversion{}
	if err := db.Where("conversion_id = ?", conversionId).First(&conversion).Error; err != nil {
		return fmt.Errorf("failed to fetch conversion: %w", err)
	}

	if !conversion.EnableWatch {
		return nil
	}

	if conversion.Status != "completed" {
		return nil
	}

	destinationPlaylistID := conversion.CreatedPlaylistId

	if destinationPlaylistID == "" {
		if conversion.CreatedPlaylistLink == "" {
			return errors.New("destination playlist id and link are empty")
		}
		return errors.New("could not resolve destination playlist id")
	}

	youtubeClient, spotifyClient, err := CreateClientsForUser(db, conversion.UserId)
	if err != nil {
		return fmt.Errorf("failed to create platform clients: %w", err)
	}

	user := models.User{}
	if err := db.Where("user_id = ?", conversion.UserId).First(&user).Error; err != nil {
		return fmt.Errorf("failed to fetch user for watch sync: %w", err)
	}

	var sourceClient clients.PlatformClient
	var destinationClient clients.PlatformClient

	if conversion.SourcePlatform == config.SPOTIFY {
		sourceClient = clients.NewSpotifyClient(spotifyClient, "")
		destinationClient = clients.NewYoutubeConverterClient(youtubeClient)
	} else if conversion.SourcePlatform == config.YOUTUBE_MUSIC {
		sourceClient = clients.NewYoutubeConverterClient(youtubeClient)
		destinationClient = clients.NewSpotifyClient(spotifyClient, user.SpotifyId)
	} else {
		return fmt.Errorf("unsupported source platform: %s", conversion.SourcePlatform)
	}

	latestTracks, err := sourceClient.GetPlaylistTracks(conversion.PlaylistId)
	if err != nil {
		return fmt.Errorf("failed to fetch latest source tracks: %w", err)
	}

	newTracks := getNewTracks(conversion.PlaylistTracks, latestTracks)
	if len(newTracks) == 0 {
		now := time.Now()
		_ = db.Model(&models.ConversionWatch{}).Where("conversion_id = ?", conversion.ConversionID).Updates(map[string]interface{}{
			"last_synced_at":   now,
			"last_track_count": len(latestTracks),
		}).Error
		return nil
	}

	ctx := context.Background()
	conversionResults := conversion.Result
	if conversionResults == nil {
		conversionResults = map[string]models.TrackConversionResult{}
	}

	destinationTracksToAdd := []string{}
	for _, track := range newTracks {
		trackCopy := track
		result := models.TrackConversionResult{}

		searchResult, err := searchTrack(ctx, cache, conversion.SourcePlatform, &trackCopy, destinationClient)
		if err != nil {
			result.Error = "server error"
		} else if searchResult == nil {
			result.Error = "Not found"
		} else {
			result.Data = searchResult.ID
			destinationTracksToAdd = append(destinationTracksToAdd, searchResult.ID)
		}

		conversionResults[track.ID] = result
	}

	if len(destinationTracksToAdd) > 0 {
		if err := destinationClient.AddTracksToPlaylist(destinationPlaylistID, destinationTracksToAdd); err != nil {
			return fmt.Errorf("failed to append tracks to destination playlist: %w", err)
		}
	}

	now := time.Now()
	updates := map[string]interface{}{
		"playlist_tracks":     latestTracks,
		"total_tracks":        len(latestTracks),
		"result":              conversionResults,
		"created_playlist_id": destinationPlaylistID,
	}
	if err := db.Model(&models.PlaylistConversion{}).Where("conversion_id = ?", conversion.ConversionID).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed updating conversion after watch sync: %w", err)
	}

	if err := db.Model(&models.ConversionWatch{}).Where("conversion_id = ?", conversion.ConversionID).Updates(map[string]interface{}{
		"last_synced_at":   now,
		"last_track_count": len(latestTracks),
	}).Error; err != nil {
		return fmt.Errorf("failed updating conversion watch metadata: %w", err)
	}

	state := ConversionState{
		ConversionID:        conversion.ConversionID,
		PlaylistLink:        conversion.PlaylistLink,
		Status:              conversion.Status,
		Result:              conversionResults,
		CreatedPlaylistLink: conversion.CreatedPlaylistLink,
		CreatedPlaylistId:   destinationPlaylistID,
	}
	if err := state.Save(ctx, cache); err != nil {
		log.Println("error updating conversion cache state after watch sync:", err)
	}

	return nil
}
