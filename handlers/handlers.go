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

	"github.com/tobyleye/playlist-converter/models"
	"github.com/tobyleye/playlist-converter/oauth"
	SpotifyService "github.com/tobyleye/playlist-converter/services/spotify"
	YoutubeService "github.com/tobyleye/playlist-converter/services/youtube"
	ytmusicapi "github.com/tobyleye/playlist-converter/services/ytmusicapi"
	"github.com/tobyleye/playlist-converter/session"
	"github.com/tobyleye/playlist-converter/types"
	"gorm.io/gorm"
)

func parseBody(c echo.Context) map[string]string {
	body := make(map[string]string)
	json.NewDecoder(c.Request().Body).Decode(&body)
	return body
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

func handleTrackConversion(h Handlers, c echo.Context, parsedLink Query, destinationPlatform string) error {
	// var result any
	// var err error
	// if destinationPlatform == SPOTIFY {
	// 	result, err = youtubeToSpotify(h.YoutubeClient, h.SpotifyClient, h.Context, parsedLink)

	// } else if destinationPlatform == YOUTUBE_MUSIC {
	// 	result, err = spotifyToYoutube(h.YoutubeClient, h.SpotifyClient, h.Context, parsedLink)
	// }
	// if err != nil {
	// 	return c.JSON(500, struct{}{})
	// }
	// return c.JSON(200, result)

	return c.JSON(400, errorResponse("track conversion not supported"))
}

func (h Handlers) Convert(c echo.Context) error {
	body := parseBody(c)
	link := body["link"]
	user := session.GetUserFromSession(c)

	destinationPlatform := body["to_platform"]

	destinationPlatform = strings.ToLower(destinationPlatform)

	// validations
	if !isPlatformSupported(destinationPlatform) {
		return c.JSON(400, errorResponse("invalid platform"))
	}

	parsedLink, err := ParseLink(link)
	if err != nil {
		return c.JSON(400, errorResponse("link is not valid"))
	}

	if parsedLink.Platform == destinationPlatform {
		// cannot convert to same platform
		return c.JSON(400, errorResponse("cant convert to same platform"))
	}

	// handle track requests immediately
	if parsedLink.Type == "track" {
		return handleTrackConversion(h, c, parsedLink, destinationPlatform)
	}

	// handle playlist requests

	var musicLinkInfo interface{}

	isPreview := false

	if parsedLink.Platform == SPOTIFY {
		musicLinkInfo, err = SpotifyService.GetSpotifyMusicInfo(h.SpotifyClient, h.Context, parsedLink.ID, parsedLink.Type, isPreview)
	} else if parsedLink.Platform == YOUTUBE_MUSIC {
		musicLinkInfo, err = YoutubeService.GetYoutubeMusicInfo(h.YoutubeClient, parsedLink.ID, parsedLink.Type)
	}

	if err != nil {
		log.Println(err)
		return c.JSON(400, errorResponse("link did not return any results"))
	}

	playlistInfo := musicLinkInfo.(types.SimplePlaylist)

	conversionId := uuid.New().String()

	log.Println("creating conversion...", conversionId, playlistInfo.Name)

	conversion := models.Conversion{
		UserId:              user.UserId,
		Title:               playlistInfo.Name,
		ID:                  conversionId,
		Link:                link,
		SourcePlatform:      parsedLink.Platform,
		DestinationPlatform: destinationPlatform,
		ResourceId:          parsedLink.ID,
		ResourceType:        parsedLink.Type,
		Status:              "pending",
		CreatedAt:           time.Now(),
		Result:              nil,
		PlaylistInfo:        playlistInfo,
	}

	result := h.Db.Create(&conversion)

	if result.Error != nil {
		fmt.Println("error result: ", result.Error)
		return c.JSON(500, errorResponse(result.Error.Error()))
	}

	go startConversion(&conversion, h, user)

	return c.JSON(200, map[string]string{"conversion_id": conversionId})
}

func (h Handlers) RestartConversion(c echo.Context) error {
	user := session.GetUserFromSession(c)
	conversionId := c.Param("id")
	var conversion models.Conversion

	h.Db.First(&conversion, "id = ?", conversionId)
	if conversion.ID == "" {
		return c.JSON(404, struct{}{})
	}
	if conversion.Status == "pending" {
		return c.JSON(400, errorResponse("cannot restart a pending conversion"))
	}

	conversion.Status = "pending"
	conversion.Result = nil

	h.Db.Save(&conversion)

	go startConversion(&conversion, h, user)

	return c.JSON(200, struct{}{})

}

func startConversion(conversion *models.Conversion, h Handlers, user session.UserSession) {

	var destinationPlatform string = conversion.DestinationPlatform

	var playlistInfo interface{} = conversion.PlaylistInfo

	// var result map[string]interface{}
	result := make(map[string]interface{})

	tracks := playlistInfo.(types.SimplePlaylist).Tracks.Tracks

	youtubeIds := []string{}
	spotifyIds := []string{}

	for _, track := range tracks {

		var searchResultLink string
		var err error

		searchQuery := types.SearchQuery{
			Title:   track.Name,
			Artists: track.Artists,
			Type:    "audio",
		}

		fmt.Printf("searchQuery: %v\n", searchQuery)

		if destinationPlatform == YOUTUBE_MUSIC {

			fmt.Println("searching on youtube...")

			var results []ytmusicapi.SearchResultItem
			results, err = ytmusicapi.Search(searchQuery)
			fmt.Printf("results %#v", results)
			searchedTrack := results[0]
			youtubeIds = append(youtubeIds, searchedTrack.VideoId)
			searchResultLink = searchedTrack.Link

		} else if destinationPlatform == SPOTIFY {
			fmt.Println("searching on spotify...")
			var searchedTrack types.SimpleTrack
			searchedTrack, err = SpotifyService.SearchSpotify(h.SpotifyClient, h.Context, searchQuery)
			spotifyIds = append(spotifyIds, searchedTrack.ID)
			searchResultLink = searchedTrack.Link
		}

		if err == nil {
			result[track.ID] = searchResultLink
		} else {
			result[track.ID] = "error"
		}

		conversion.Result = result

		err = nil // reset error
		h.Db.Save(&conversion)
	}

	conversion.Status = "completed"

	var transferError error

	// transfer playlist here

	if destinationPlatform == YOUTUBE_MUSIC {
		// create youtube playlist
		httpClient, err := oauth.CreateYoutubeClient(h.Db, conversion.UserId)
		if err == nil {
			_, err = ytmusicapi.CreatePlaylist(httpClient, conversion.Title, "", youtubeIds)
		}
		transferError = err

	} else if destinationPlatform == SPOTIFY {
		// create spotify playlist
		_, transferError = SpotifyService.CreatePlaylist(h.SpotifyClient, h.Context, user.SpotifyId, conversion.Title, "", spotifyIds)
	}

	if transferError == nil {
		conversion.PlaylistCreationStatus = true
	}

	h.Db.Save(conversion)
}

func (h Handlers) GetSingleConversion(c echo.Context) error {
	conversionId := c.Param("id")
	var conversion models.Conversion
	h.Db.First(&conversion, "id = ?", conversionId)
	if conversion.ID == "" {
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
	var conversions []models.Conversion
	h.Db.Select([]string{"ID", "Title", "Link", "ResourceType", "ResourceId", "DestinationPlatform", "SourcePlatform", "Status"}).Find(&conversions)

	fmt.Printf("conversions: %#v\n", conversions)
	return c.JSON(200, conversions)
}

func isPlatformKnown(platform string) bool {
	if platform == YOUTUBE_MUSIC || platform == SPOTIFY {
		return true
	}
	return false
}

func (h Handlers) PreviewLink(c echo.Context) error {
	link := c.QueryParam("link")
	parsedLink, err := ParseLink(link)

	fmt.Println("query: ", parsedLink.Platform, parsedLink.Type, parsedLink.ID)

	if err != nil {
		return c.JSON(400, struct{}{})
	}

	if !isPlatformKnown(parsedLink.Platform) {
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
