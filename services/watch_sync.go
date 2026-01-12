package services

// import (
// "context"
// "fmt"
// "log"
// "time"

// "github.com/tobyleye/playlift/config"
// "github.com/tobyleye/playlift/core/converter/clients"
// "github.com/tobyleye/playlift/core/ytmusicapi"
// "github.com/tobyleye/playlift/models"
// "github.com/zmb3/spotify/v2"
// spotifyAuth "github.com/zmb3/spotify/v2/auth"
// "golang.org/x/oauth2"
// "gorm.io/gorm"
// )

// // SyncWatchedPlaylists checks all active watches and syncs new tracks
// func SyncWatchedPlaylists(db *gorm.DB) error {
// 	// Get all active watches
// 	var watches []models.PlaylistWatch
// 	if err := db.Where("status = ?", "active").Find(&watches).Error; err != nil {
// 		return fmt.Errorf("failed to fetch active watches: %w", err)
// 	}

// 	log.Printf("Found %d active watches to sync", len(watches))

// 	for _, watch := range watches {
// 		if err := syncWatch(db, &watch); err != nil {
// 			log.Printf("Error syncing watch %s: %v", watch.WatchID, err)
// 			// Update watch status to error but continue with others
// 			watch.Status = "error"
// 			watch.UpdatedAt = time.Now()
// 			db.Save(&watch)
// 		}
// 	}

// 	return nil
// }

// func syncWatch(db *gorm.DB, watch *models.PlaylistWatch) error {
// 	log.Printf("Syncing watch %s: %s -> %s", watch.WatchID, watch.OriginPlatform, watch.DestinationPlatform)

// 	// Get user with tokens
// 	var user models.User
// 	if err := db.Preload("Tokens").Where("user_id = ?", watch.UserId).First(&user).Error; err != nil {
// 		return fmt.Errorf("failed to fetch user: %w", err)
// 	}

// 	// Create platform clients
// 	sourceClient, err := createClientForPlatform(watch.OriginPlatform, &user)
// 	if err != nil {
// 		return fmt.Errorf("failed to create source client: %w", err)
// 	}

// 	destinationClient, err := createClientForPlatform(watch.DestinationPlatform, &user)
// 	if err != nil {
// 		return fmt.Errorf("failed to create destination client: %w", err)
// 	}

// 	// Get current tracks from origin playlist
// 	currentTracks, err := sourceClient.GetPlaylistTracks(watch.OriginPlaylistId)
// 	if err != nil {
// 		return fmt.Errorf("failed to fetch playlist tracks: %w", err)
// 	}

// 	// Check if there are new tracks
// 	if len(currentTracks) <= watch.LastTrackCount {
// 		log.Printf("No new tracks for watch %s (current: %d, last: %d)", watch.WatchID, len(currentTracks), watch.LastTrackCount)
// 		return nil
// 	}

// 	// Get only the new tracks (tracks added since last sync)
// 	newTracks := currentTracks[watch.LastTrackCount:]
// 	log.Printf("Found %d new tracks for watch %s", len(newTracks), watch.WatchID)

// 	// Search and add each new track to destination playlist
// 	addedCount := 0
// 	for _, track := range newTracks {
// 		searchResult, err := destinationClient.SearchTrack(track.Title, track.Artists)
// 		if err != nil {
// 			log.Printf("Failed to find track '%s - %s' on %s: %v", track.Artists, track.Title, watch.DestinationPlatform, err)
// 			continue
// 		}

// 		if searchResult == nil || searchResult.Id == "" {
// 			log.Printf("No match found for track '%s - %s' on %s", track.Artists, track.Title, watch.DestinationPlatform)
// 			continue
// 		}

// 		err = destinationClient.AddTrack(watch.DestinationPlaylistId, searchResult.Id)
// 		if err != nil {
// 			log.Printf("Failed to add track to playlist: %v", err)
// 			continue
// 		}
// 		addedCount++
// 	}

// 	// Update watch with new sync info
// 	watch.LastSyncedAt = time.Now()
// 	watch.LastTrackCount = len(currentTracks)
// 	watch.TotalSynced += addedCount
// 	watch.UpdatedAt = time.Now()

// 	if err := db.Save(watch).Error; err != nil {
// 		return fmt.Errorf("failed to update watch: %w", err)
// 	}

// 	log.Printf("Successfully synced %d new tracks for watch %s", addedCount, watch.WatchID)
// 	return nil
// }

// func createClientForPlatform(platform string, user *models.User) (clients.PlatformClient, error) {
// 	ctx := context.Background()

// 	if platform == "spotify" {
// 		// Get Spotify token
// 		var spotifyToken *models.Token
// 		for _, token := range user.Tokens {
// 			if token.Platform == "spotify" {
// 				spotifyToken = &token
// 				break
// 			}
// 		}
// 		if spotifyToken == nil {
// 			return nil, fmt.Errorf("spotify token not found")
// 		}

// 		oauth2Token := &oauth2.Token{
// 			AccessToken:  spotifyToken.AccessToken,
// 			RefreshToken: spotifyToken.RefreshToken,
// 			Expiry:       spotifyToken.ExpiresIn,
// 			TokenType:    "Bearer",
// 		}

// 		httpClient := spotifyAuth.New(
// spotifyAuth.WithClientID(config.SPOTIFY_CLIENT_ID),
// spotifyAuth.WithClientSecret(config.SPOTIFY_CLIENT_SECRET),
// ).Client(ctx, oauth2Token)

// 		spotifyClient := spotify.New(httpClient)
// 		return clients.NewSpotifyClient(spotifyClient, user.SpotifyId), nil

// 	} else if platform == "youtube" {
// 		// Get YouTube token
// 		var youtubeToken *models.Token
// 		for _, token := range user.Tokens {
// 			if token.Platform == "youtube" {
// 				youtubeToken = &token
// 				break
// 			}
// 		}
// 		if youtubeToken == nil {
// 			return nil, fmt.Errorf("youtube token not found")
// 		}

// 		youtubeClient := ytmusicapi.NewClient(&ytmusicapi.ClientConfig{
// 			AccessToken: youtubeToken.AccessToken,
// 		})
// 		return clients.NewYoutubeConverterClient(youtubeClient), nil
// 	}

// 	return nil, fmt.Errorf("unsupported platform: %s", platform)
// }
