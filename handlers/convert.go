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

var YOUTUBE_MUSIC = "youtube_music"
var SPOTIFY = "spotify"

var SUPPORTED_PLATFORMS = []string{SPOTIFY, YOUTUBE_MUSIC}

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

			user := &models.User{}
			db.First(user, "user_id = ?", conversion.UserId)

			// handle single conversion
			userId := conversion.UserId

			// create context
			ctx := context.Background()

			if conversion.SourcePlatform == SPOTIFY {
				log.Println("starting conversion from spotify to youtube music...", conversion.PlaylistId)
				spotifyClient, _ := config.CreateUserSpotifyClient(db, userId)
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

					artists := []string{}
					for _, artist := range track.Track.Track.Artists {
						artists = append(artists, artist.Name)
					}

					searchResult, err := ytmusicapi.SearchOne(youtubeClient, types.SearchQuery{
						Title:   trackTitle,
						Artists: artists,
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

				spotifyClient, err := config.CreateUserSpotifyClient(db, userId)
				youtubeClient, err := config.CreateYoutubeClientForUser(db, userId)

				if err != nil {
					log.Println("error creating spotify client:", err)
					conversion.Status = "failed"
					db.Save(conversion)
					return
				}

				// fetch all the youtube music playlist tracks
				log.Println("fetching youtube music playlist tracks...")
				playlistTracks, err := ytmusicapi.FetchAllPlaylistTracks(youtubeClient, conversion.PlaylistId)

				if err != nil {
					log.Println("error fetching youtube playlists:", err)
					conversion.Status = "failed"
					db.Save(conversion)
					return
				}

				spotifyTracks := []spotify.ID{}

				for _, track := range playlistTracks.Tracks {
					query := fmt.Sprintf("track:%s artist:%s", track.Title, strings.Join(track.Artists, ", "))
					result, err := spotifyClient.Search(ctx, query, spotify.SearchTypeTrack, spotify.Limit(1))

					if err != nil {
						log.Printf("error searching for track %s(%s) on spotify:", track.Title, track.VideoId)
						continue
					}

					if result.Tracks.Total == 0 {
						log.Println("no result found for track:", track.Title, track.VideoId, track.Artists)
						continue
					}

					if result.Tracks.Total > 0 {
						bestResult := result.Tracks.Tracks[0]
						spotifyTracks = append(spotifyTracks, bestResult.ID)
					}

				}

				log.Println("found a total of", len(spotifyTracks), "tracks to add to spotify playlist")

				if len(spotifyTracks) > 0 {

					createdPlaylist, err := spotifyClient.CreatePlaylistForUser(ctx, user.SpotifyId, conversion.PlaylistTitle, "", false, false)

					if err != nil {
						log.Println("error creating spotify playlist:", err)
						conversion.Status = "failed"
						db.Save(conversion)
						return
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
							conversion.Status = "failed"
							db.Save(conversion)
							break
						}

						if endIndex >= len(spotifyTracks) {
							break
						} else {
							startIndex = endIndex

						}

					}

					conversion.Status = "completed"
					db.Save(conversion)

				}
			}
		}()
	}
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

	h.Db.Save(&conversion)

	return c.JSON(200, struct{}{})
}

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
