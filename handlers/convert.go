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
	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v4"
	"github.com/zmb3/spotify/v2"
	"google.golang.org/api/youtube/v3"

	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	"github.com/tobyleye/playlist-converter/services/ytmusicapi"
	"github.com/tobyleye/playlist-converter/session"
	"github.com/tobyleye/playlist-converter/types"
	"gorm.io/gorm"
)

func requestBodyToMap(c echo.Context) map[string]interface{} {
	body := make(map[string]interface{})
	json.NewDecoder(c.Request().Body).Decode(&body)
	return body
}

func requestBodyToStruct(c echo.Context, v interface{}) {
	decoder := json.NewDecoder(c.Request().Body)
	decoder.DisallowUnknownFields() // Prevent unknown fields
	decoder.Decode(v)
}

type Handlers struct {
	Db            *gorm.DB
	SpotifyClient *spotify.Client
	Context       context.Context
	YoutubeClient *youtube.Service
	SessionStore  *sessions.CookieStore
}

var YOUTUBE_MUSIC = "youtube_music"
var SPOTIFY = "spotify"

var SUPPORTED_PLATFORMS = []string{SPOTIFY, YOUTUBE_MUSIC}

func isPlatformSupported(platform string) bool {
	for _, each := range SUPPORTED_PLATFORMS {
		if each == platform {
			return true
		}
	}
	return false
}

func errorResponse(message string) interface{} {

	return struct {
		Error string `json:"error"`
	}{Error: message}
}

func getAllPlaylistTracks(spotifyClient *spotify.Client, ctx context.Context, playlistId string) ([]spotify.PlaylistItem, error) {
	var allTracks []spotify.PlaylistItem
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
		allTracks = append(allTracks, tracks.Items...)
		if tracks.Next == "" {
			break
		}

		offset += len(tracks.Items)

	}

	return allTracks, nil
}

func startConversions(db *gorm.DB, conversions ...*models.PlaylistConversion) {
	log.Println("starting conversions for", len(conversions), "playlists")
	for _, conversion := range conversions {
		go func() {
			log.Println(">>> running goroutine")

			// handle single conversion

			userId := conversion.UserId
			// get user keys
			// tokens, err := models.GetUserTokens(db, userId)
			// // tokens.Spotify
			// if err != nil {p
			// 	log.Println("error getting user tokens:", err)
			// 	return
			// }

			// create context
			ctx := context.Background()

			if conversion.SourcePlatform == SPOTIFY {
				log.Println("starting conversion from spotify to youtube music...", conversion.PlaylistId)
				spotifyClient, err := config.CreateUserSpotifyClient(db, userId)
				youtubeClient, err := config.CreateYoutubeClientForUser(db, userId)

				if err != nil {
					log.Println("error creating spotify client:", err)
					return
				}

				tracks, err := getAllPlaylistTracks(spotifyClient, ctx, conversion.PlaylistId)
				log.Println("got a total of ", len(tracks), "tracks from spotify playlist")
				if err != nil {
					log.Println("error getting all playlist tracks client:", err)
					return
				}

				youtubeTracks := []string{}

				for _, track := range tracks {
					trackTitle := track.Track.Track.Name
					// map

					searchResult, err := ytmusicapi.SearchOne(youtubeClient, types.SearchQuery{
						Title:   trackTitle,
						Artists: []string{track.Track.Track.Artists[0].Name},
						Type:    "audio",
					})

					if err != nil {
						log.Println("error searching for track on youtube music:", err)
						continue
					}
					if searchResult.VideoId == "" {
						log.Println("no result found for track:", trackTitle)
						continue
					}

					log.Println("found track on youtube music:", searchResult.Title, "link:", searchResult.Link)
					youtubeTracks = append(youtubeTracks, searchResult.VideoId)
				}

				log.Println("creating youtube music playlist with", len(youtubeTracks), "tracks")
				_, err = ytmusicapi.CreatePlaylist(youtubeClient, conversion.PlaylistTitle,
					"", youtubeTracks)

				if err != nil {
					log.Println("error creating youtube music playlist:", err)
					conversion.Status = "failed"
					db.Save(conversion)
					return
				} else {
					conversion.Status = "completed"
					db.Save(conversion)
				}

			} else if conversion.SourcePlatform == YOUTUBE_MUSIC {
				log.Println("starting conversion from youtube music to spotify...", conversion.PlaylistId)

				// Create Spotify client
				// spotifyClient, err := config.CreateUserSpotifyClient(db, userId)
				// if err != nil {
				// 	log.Println("error creating spotify client:", err)
				// 	conversion.Status = "failed"
				// 	db.Save(conversion)
				// 	return
				// }

				// // Fetch YouTube Music playlist tracks
				// playlistResponse, err := ytmusicapi.FetchPlaylist(conversion.PlaylistId)
				// if err != nil {
				// 	log.Println("error fetching youtube music playlist:", err)
				// 	conversion.Status = "failed"
				// 	db.Save(conversion)
				// 	return
				// }

				// // Parse the response to get tracks
				// playlistData := playlistResponse.(struct {
				// 	PlaylistTracks []ytmusicapi.SearchResultItem
				// })
				// tracks := playlistData.PlaylistTracks

				// log.Println("got a total of", len(tracks), "tracks from youtube music playlist")

				// spotifyTrackIds := []string{}

				// // Search for each track on Spotify
				// for _, track := range tracks {
				// 	trackTitle := track.Title
				// 	artists := track.Artists

				// 	searchResult, err := spotify_service.SearchSpotify(spotifyClient, ctx, types.SearchQuery{
				// 		Title:   trackTitle,
				// 		Artists: artists,
				// 		Type:    "audio",
				// 	})

				// 	if err != nil {
				// 		log.Println("error searching for track on spotify:", err)
				// 		continue
				// 	}
				// 	if searchResult.ID == "" {
				// 		log.Println("no result found for track:", trackTitle)
				// 		continue
				// 	}

				// 	log.Println("found track on spotify:", searchResult.Name, "link:", searchResult.Link)
				// 	spotifyTrackIds = append(spotifyTrackIds, searchResult.ID)
				// }

				// log.Println("creating spotify playlist with", len(spotifyTrackIds), "tracks")

				// // Get user's Spotify ID
				// var user models.User
				// db.Where("user_id = ?", userId).First(&user)
				// if user.SpotifyId == "" {
				// 	log.Println("user spotify id not found")
				// 	conversion.Status = "failed"
				// 	db.Save(conversion)
				// 	return
				// }

				// // Create Spotify playlist
				// playlistId, err := spotify_service.CreatePlaylist(spotifyClient, ctx, user.SpotifyId,
				// 	conversion.PlaylistTitle, "", spotifyTrackIds)

				// if err != nil {
				// 	log.Println("error creating spotify playlist:", err)
				// 	conversion.Status = "failed"
				// 	db.Save(conversion)
				// 	return
				// } else {
				// 	log.Println("successfully created spotify playlist with ID:", playlistId)
				// 	conversion.Status = "completed"
				// 	db.Save(conversion)
				// }

			}
		}()
	}
}

type PlaylistDetails struct {
	Title       string `json:"title"`
	Link        string `json:"link"`
	TotalTracks int    `json:"total_tracks"`
}

type AllPlaylistDetails map[string]PlaylistDetails

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

func (h Handlers) Convert(c echo.Context) error {

	var body struct {
		Destination string   `json:"destination"`
		Source      string   `json:"source"`
		Playlists   []string `json:"playlists"`
	}

	requestBodyToStruct(c, &body)

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
	var allPlaylistsDetails AllPlaylistDetails

	// this is just to verify the playlist exists, we don't need to fetch all playlists
	if sourcePlatform == SPOTIFY {
		// get the playlist info from spotify to verify they exists
		// might remove this, i don't know. it's actually needed but it might make the
		// response time longer because of the number of requests we make.
		// spotify makes this easy though because the playlists cant be passed in batches.
		// youtube music on the other hand, the playlists have to be fetched one by one.

		// musicLinkInfo, err = SpotifyService.GetSpotifyMusicInfo(h.SpotifyClient, h.Context, parsedLink.ID, parsedLink.Type, isPreview)
		client, err := config.CreateUserSpotifyClient(h.Db, user.UserId)
		// we don't expect an error but we check anyways
		if err != nil {
			log.Println("Convert-Handler: error creating spotify client:", err)
			return c.JSON(401, errorResponse("unauthorized"))
		}

		allPlaylistsDetails = fetchSpotifyPlaylistsDetails(client, c.Request().Context(), body.Playlists)

	} else if sourcePlatform == YOUTUBE_MUSIC {
		// do the same thing for youtube music
		// ytubeClient, err := config.CreateYoutubeClientForUser(h.Db, user.UserId)
		client, err := config.CreateYoutubeClientForUser(h.Db, user.UserId)
		if err != nil {
			log.Println("Convert-Handler: error creating spotify client:", err)
			return c.JSON(401, errorResponse("unauthorized"))
		}

		allPlaylistsDetails = fetchYoutubePlaylistsDetails(client, c.Request().Context(), body.Playlists)

	}

	// if err != nil {
	// 	log.Println(err)
	// 	return c.JSON(400, errorResponse("link did not return any results"))
	// }

	var conversions = []*models.PlaylistConversion{}

	for _, playlistId := range body.Playlists {

		playlistDetails := allPlaylistsDetails[playlistId]

		conversion := models.PlaylistConversion{
			UserId:              user.UserId,
			PlaylistTitle:       playlistDetails.Title, // unknown now... to be set later
			ConversionID:        uuid.New().String(),
			Link:                playlistDetails.Link,
			TotalTracks:         playlistDetails.TotalTracks,
			SourcePlatform:      sourcePlatform,
			DestinationPlatform: destinationPlatform,
			Status:              "pending",
			CreatedAt:           time.Now(),
			PlaylistId:          playlistId,
		}

		conversions = append(conversions, &conversion)
	}

	// create conversions in the database
	result := h.Db.Create(&conversions)

	if result.Error != nil {
		fmt.Println("error result: ", result.Error)
		return c.JSON(500, errorResponse(result.Error.Error()))
	}

	// start a goroutine to handle the conversion
	go startConversions(h.Db, conversions...)

	conversionIds := []string{}
	for _, conversion := range conversions {
		conversionIds = append(conversionIds, conversion.ConversionID)
	}

	return c.JSON(200, map[string]interface{}{"data": conversionIds})
}

func (h Handlers) RestartConversion(c echo.Context) error {
	// user, _ := session.GetUserFromSession(c)
	conversionId := c.Param("id")
	var conversion models.PlaylistConversion

	h.Db.First(&conversion, "id = ?", conversionId)
	if conversion.ConversionID == "" {
		return c.JSON(404, struct{}{})
	}
	if conversion.Status == "pending" {
		return c.JSON(400, errorResponse("cannot restart a pending conversion"))
	}

	conversion.Status = "pending"
	// conversion.Result = nil

	h.Db.Save(&conversion)

	// go startConversion(&conversion, h, user)

	return c.JSON(200, struct{}{})

}

// func startConversion(conversion *models.PlaylistConversion, h Handlers, user session.UserSession) {

// 	var destinationPlatform string = conversion.DestinationPlatform

// 	var playlistInfo interface{} = conversion.PlaylistInfo

// 	// var result map[string]interface{}
// 	result := make(map[string]interface{})

// 	tracks := playlistInfo.(types.SimplePlaylist).Tracks.Tracks

// 	youtubeIds := []string{}
// 	spotifyIds := []string{}

// 	for _, track := range tracks {

// 		var searchResultLink = ""
// 		var err error

// 		searchQuery := types.SearchQuery{
// 			Title:   track.Name,
// 			Artists: track.Artists,
// 			Type:    "audio",
// 		}

// 		log.Println("searchQuery:", searchQuery)

// 		if destinationPlatform == YOUTUBE_MUSIC {
// 			fmt.Println("searching on youtube...")
// 			var searchedTrack ytmusicapi.SearchResultItem
// 			searchedTrack, err = ytmusicapi.SearchOne(searchQuery)

// 			log.Println("search result: ", searchedTrack)
// 			if err == nil && searchedTrack.VideoId != "" {
// 				youtubeIds = append(youtubeIds, searchedTrack.VideoId)
// 				searchResultLink = searchedTrack.Link
// 			}

// 		} else if destinationPlatform == SPOTIFY {
// 			fmt.Println("searching on spotify...")
// 			var searchedTrack types.SimpleTrack
// 			searchedTrack, err = SpotifyService.SearchSpotify(h.SpotifyClient, h.Context, searchQuery)

// 			if err == nil && searchedTrack.ID != "" {
// 				spotifyIds = append(spotifyIds, searchedTrack.ID)
// 				searchResultLink = searchedTrack.Link
// 			}
// 		}

// 		if err == nil {
// 			result[track.ID] = searchResultLink
// 		} else {
// 			result[track.ID] = "error"
// 		}

// 		conversion.Result = result

// 		err = nil // reset error
// 		h.Db.Save(&conversion)
// 	}

// 	conversion.Status = "completed"

// 	var transferError error

// 	// transfer playlist here

// 	if destinationPlatform == YOUTUBE_MUSIC {
// 		// create youtube playlist
// 		httpClient, err := config.CreateYoutubeClient(h.Db, conversion.UserId)
// 		if err == nil {
// 			_, err = ytmusicapi.CreatePlaylist(httpClient, conversion.Title, "", youtubeIds)
// 		}
// 		transferError = err

// 	} else if destinationPlatform == SPOTIFY {
// 		// create spotify playlist
// 		_, transferError = SpotifyService.CreatePlaylist(h.SpotifyClient, h.Context, user.SpotifyId, conversion.Title, "", spotifyIds)
// 	}

// 	if transferError == nil {
// 		conversion.PlaylistCreationStatus = true
// 	}

// 	h.Db.Save(conversion)
// }

func (h Handlers) GetSingleConversion(c echo.Context) error {
	conversionId := c.Param("id")
	var conversion models.PlaylistConversion
	h.Db.First(&conversion, "id = ?", conversionId)
	if conversion.ConversionID == "" {
		return c.JSON(404, struct{}{})
	}
	fmt.Printf("conversions: %v\n", conversion.Link)
	return c.JSON(200, conversion)
}

func (h Handlers) DeleteConversion(c echo.Context) error {
	conversionId := c.Param("id")
	var conversion models.Conversion
	h.Db.First(&conversion, "id = ?", conversionId)
	if conversion.ID == "" {
		return c.JSON(404, struct{}{})
	}
	h.Db.Delete(&conversion)
	return c.JSON(200, struct{}{})
}

func (h Handlers) GetAllConversions(c echo.Context) error {

	user, _ := session.GetUserFromSession(c)
	type ConversionResponse struct {
		ConversionID        string    `json:"conversion_id"`
		PlaylistTitle       string    `json:"playlist_title"`
		Link                string    `json:"link"`
		PlaylistId          string    `json:"playlist_id"`
		DestinationPlatform string    `json:"destination_platform"`
		SourcePlatform      string    `json:"source_platform"`
		Status              string    `json:"status"`
		TotalTracks         int       `json:"total_tracks"`
		CreatedAt           time.Time `json:"created_at"`
	}

	var conversions []ConversionResponse

	queryResult := h.Db.Model(&models.PlaylistConversion{}).Where("user_id = ?", user.UserId).Find(&conversions)

	if queryResult.Error != nil {
		log.Println("get all conversion error:", queryResult.Error)
	}

	return c.JSON(200, conversions)
}

func (h Handlers) GetConnectionStatus(c echo.Context) error {
	// a handler to check if the user has connected their spotify and youtube accounts
	// this will be used to show the connection status on the frontend
	user, _ := session.GetUserFromSession(c)
	userTokens := []models.Token{}
	h.Db.Find(&userTokens, "user_id = ?", user.UserId)

	log.Println("user tokens:", userTokens)
	spotifyConnected := false
	youtubeConnected := false

	if len(userTokens) > 0 {
		for _, token := range userTokens {
			if token.Platform == "spotify" {
				spotifyConnected = true
			} else if token.Platform == "youtube" {
				youtubeConnected = true
			}
		}
	}

	return c.JSON(200, map[string]bool{
		"spotify_connected": spotifyConnected,
		"youtube_connected": youtubeConnected,
	})

}
