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
	SpotifyService "github.com/tobyleye/playlist-converter/services/spotify"
	YoutubeService "github.com/tobyleye/playlist-converter/services/youtube"
	"github.com/tobyleye/playlist-converter/session"
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

func startConversions(db *gorm.DB, conversions ...*models.PlaylistConversion) {
	for _, conversion := range conversions {
		go func() {
			fmt.Println("i don't know how to start it yet..")
			fmt.Println("i do, i'm just lieing...")
			fmt.Println("starting conversion for playlist:", conversion.PlaylistId)
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
	var result AllPlaylistDetails = make(AllPlaylistDetails)
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

func (h Handlers) Convert(c echo.Context) error {

	var body struct {
		Destination string   `json:"destination"`
		Source      string   `json:"source"`
		Playlists   []string `json:"playlists"`
	}

	requestBodyToStruct(c, &body)

	user := session.GetUserFromSession(c)

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
		// todo
	}

	// if err != nil {
	// 	log.Println(err)
	// 	return c.JSON(400, errorResponse("link did not return any results"))
	// }

	var conversions = []*models.PlaylistConversion{}

	for _, playlistId := range body.Playlists {

		playlistDetails, _ := allPlaylistsDetails[playlistId]
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
	// user := session.GetUserFromSession(c)
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
	conversions := []models.PlaylistConversion{}
	user := session.GetUserFromSession(c)
	res := h.Db.Where("user_id = ?", user.UserId).Select(
		[]string{"ConversionID", "PlaylistTitle", "Link", "PlaylistId", "DestinationPlatform", "SourcePlatform", "Status"},
	).Find(&conversions)
	fmt.Println("query error:", res.Error)

	fmt.Printf("conversion...: %#v\n", conversions)
	return c.JSON(200, conversions)
}

func (h Handlers) PreviewLink(c echo.Context) error {
	link := c.QueryParam("link")
	parsedLink, err := ParseLink(link)

	fmt.Println("query: ", parsedLink.Platform, parsedLink.Type, parsedLink.ID)

	if err != nil {
		return c.JSON(400, struct{}{})
	}

	if !isPlatformSupported(parsedLink.Platform) {
		return c.JSON(http.StatusBadRequest, "invalid link")
	}

	var queryInfo interface{}

	isPreview := true

	if parsedLink.Platform == SPOTIFY {
		queryInfo, err = SpotifyService.GetSpotifyMusicInfo(h.SpotifyClient, h.Context, parsedLink.ID, parsedLink.Type, isPreview)

	} else if parsedLink.Platform == YOUTUBE_MUSIC {
		queryInfo, err = YoutubeService.GetYoutubeMusicInfo(h.YoutubeClient, parsedLink.ID, parsedLink.Type)

	}

	if err != nil {
		log.Println(err.Error())
		return c.JSON(400, struct{}{})
	}

	return c.JSON(200, struct {
		Type   string      `json:"type"`
		Object interface{} `json:"object"`
	}{
		Type:   parsedLink.Type,
		Object: queryInfo,
	})
}
