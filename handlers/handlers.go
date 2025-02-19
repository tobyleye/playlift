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
	spotify_service "github.com/tobyleye/playlist-converter/services/spotify"
	youtube_service "github.com/tobyleye/playlist-converter/services/youtube"
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

func (h Handlers) Home(c echo.Context) error {
	return c.Render(200, "home", nil)
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
		musicLinkInfo, err = spotify_service.GetSpotifyMusicInfo(h.SpotifyClient, h.Context, parsedLink.ID, parsedLink.Type, isPreview)
	} else if parsedLink.Platform == YOUTUBE_MUSIC {
		musicLinkInfo, err = youtube_service.GetYoutubeMusicInfo(h.YoutubeClient, parsedLink.ID, parsedLink.Type)
	}

	if err != nil {
		log.Println(err)
		return c.JSON(400, errorResponse("link did not return any results"))
	}

	playlistInfo := musicLinkInfo.(types.SimplePlaylist)

	conversionId := uuid.New().String()

	// preview
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

	go startConversion(destinationPlatform, playlistInfo, conversion, h)

	return c.JSON(200, map[string]string{"conversion_id": conversionId})
}

func (h Handlers) RestartConversion(c echo.Context) error {
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

	playlistInfo := conversion.PlaylistInfo

	go startConversion(conversion.DestinationPlatform, playlistInfo, conversion, h)

	return c.JSON(200, struct{}{})

}

func startConversion(destinationPlatform string, playlistInfo interface{}, conversion models.Conversion, h Handlers) {

	// var result map[string]interface{}
	result := make(map[string]interface{})

	tracks := playlistInfo.(types.SimplePlaylist).Tracks.Tracks

	for _, track := range tracks {

		// var searchedTrack interface{}
		// var searchResultId string
		var searchResultLink string
		var err error

		if destinationPlatform == YOUTUBE_MUSIC {
			searchQuery := track.Name + " by " + track.Artists[0] + " (audio)"
			fmt.Println("search query:", searchQuery)
			fmt.Println("searching on youtube...")
			var results []ytmusicapi.SearchResultItem
			results, err = ytmusicapi.Search(searchQuery)
			fmt.Printf("results %#v", results)
			searchedTrack := results[0]
			// searchResultId = searchedTrack.VideoId
			searchResultLink = searchedTrack.Link

		} else if destinationPlatform == SPOTIFY {
			searchQuery := fmt.Sprintf("track:%s artist:%s", track.Name, strings.Join(track.Artists, ", "))
			fmt.Println("search query:", searchQuery)
			var searchedTrack types.SimpleTrack
			searchedTrack, err = spotify_service.SearchSpotify(h.SpotifyClient, h.Context, searchQuery)
			fmt.Println("error --", err)
			searchResultLink = searchedTrack.Link

		}

		// fmt.Printf("searchedTrack: %#v\n", searchedTrack)
		// fmt.Println("error --", err)
		// fmt.Println("\n")

		if err == nil {
			// get link
			// if searchedTrack
			result[track.ID] = searchResultLink
		} else {
			result[track.ID] = "error"
		}

		conversion.Result = result

		if destinationPlatform == YOUTUBE_MUSIC {
			// create youtube playlist

		} else if destinationPlatform == SPOTIFY {
			// create spotify playlist
		}

		h.Db.Save(&conversion)
	}

	conversion.Status = "completed"

	// create playlist here
	h.Db.Save(&conversion)
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

	// fmt.Println("conversions: ", conversions)
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
	query, err := ParseLink(link)

	fmt.Println("query: ", query.Platform, query.Type, query.ID)

	if err != nil {
		return c.JSON(400, struct{}{})
	}

	if !isPlatformKnown(query.Platform) {
		return c.JSON(http.StatusBadRequest, "invalid link")
	}

	var queryInfo interface{}

	isPreview := true

	if query.Platform == SPOTIFY {
		queryInfo, err = spotify_service.GetSpotifyMusicInfo(h.SpotifyClient, h.Context, query.ID, query.Type, isPreview)

	} else if query.Platform == YOUTUBE_MUSIC {
		fmt.Println("querying youtube music...")
		queryInfo, err = youtube_service.GetYoutubeMusicInfo(h.YoutubeClient, query.ID, query.Type)

	}

	if err != nil {
		log.Println(err.Error())
		return c.JSON(400, struct{}{})
	}

	return c.JSON(200, struct {
		Type   string      `json:"type"`
		Object interface{} `json:"object"`
	}{
		Type:   query.Type,
		Object: queryInfo,
	})
}

func youtubeToSpotify(YoutubeClient *youtube.Service, SpotifyClient *spotify.Client, context context.Context, query Query) (interface{}, error) {
	musicInfo, err := youtube_service.GetYoutubeMusicInfo(YoutubeClient, query.ID, query.Type)
	if err != nil {
		return nil, err
	}
	if v, ok := musicInfo.(types.SimpleTrack); ok {
		fmt.Println(">>> searching for artists ", v.Artists)
		spotifySearchQuery := v.Name + " by " + v.Artists[0] + " (audio)"
		searchResult, err := spotify_service.SearchSpotify(SpotifyClient, context, spotifySearchQuery)
		if err != nil {
			return nil, err
		}
		return searchResult, nil
	} else {
		// it's probably a playlist
		return nil, nil
	}
}

func spotifyToYoutube(YoutubeClient *youtube.Service, SpotifyClient *spotify.Client, context context.Context, query Query) (interface{}, error) {
	isPreview := false
	musicInfo, err := spotify_service.GetSpotifyMusicInfo(SpotifyClient, context, query.ID, query.Type, isPreview)
	if err != nil {
		return nil, err
	}
	if v, ok := musicInfo.(types.SimpleTrack); ok {
		youtubeSearchQuery := v.Name + " by " + v.Artists[0] + " (audio)"
		youtubeSearchResult, err := youtube_service.SearchYoutube(YoutubeClient, youtubeSearchQuery)
		if err != nil {
			return nil, err
		}
		return youtubeSearchResult, nil
	}

	return nil, nil
}

/*
func (h Handlers) YoutubeToSpotify(c echo.Context) error {
	body := make(map[string]string)
	json.NewDecoder(c.Request().Body).Decode(&body)

	youtubeLink := body["youtube_link"]

	query, err := ParseLink(youtubeLink)

	fmt.Println("query: ", query.Platform, query.Type, query.ID)

	if err != nil || query.Platform != "youtube" {
		return c.JSON(400, struct{}{})
	}

	musicInfo, err := ymusicservice.GetYoutubeMusicInfo(h.YoutubeClient, query.ID, query.Type)
	if err != nil {
		return c.JSON(404, struct{}{})
	}
	if v, ok := musicInfo.(types.SimpleTrack); ok {
		fmt.Println(">>> searching for artists ", v.Artists)
		spotifySearchQuery := v.Name + " by " + v.Artists[0] + " (audio)"
		searchResult, err := spotify_service.SearchSpotify(h.SpotifyClient, h.Context, spotifySearchQuery)
		if err != nil {
			return c.JSON(404, struct{}{})
		}
		return c.JSON(200, struct {
			Type   string      `json:"type"`
			Object interface{} `json:"object"`
		}{
			Type:   "youtube",
			Object: searchResult,
		})
	} else {
		return c.JSON(500, struct{}{})
	}

}
*/

/*
func (h Handlers) SpotifyToYoutube(c echo.Context) error {

	body := make(map[string]string)
	json.NewDecoder(c.Request().Body).Decode(&body)

	spotifyLink := body["spotify_link"]

	query, err := ParseLink(spotifyLink)

	fmt.Println("query: ", query.Platform, query.Type, query.ID)

	if err != nil || query.Platform != SPOTIFY {
		return c.JSON(400, struct{}{})
	}

	isPreview := false

	musicInfo, err := spotify_service.GetSpotifyMusicInfo(h.SpotifyClient, h.Context, query.ID, query.Type, isPreview)
	if err != nil {
		return c.JSON(404, struct{}{})
	}
	if v, ok := musicInfo.(types.SimpleTrack); ok {
		youtubeSearchQuery := v.Name + " by " + v.Artists[0] + " (audio)"
		youtubeSearchResult, err := ymusicservice.SearchYoutube(h.YoutubeClient, youtubeSearchQuery)
		if err != nil {
			return c.JSON(404, struct{}{})
		}
		return c.JSON(200, struct {
			Type   string      `json:"type"`
			Object interface{} `json:"object"`
		}{
			Type:   "youtube",
			Object: youtubeSearchResult,
		})
	} else {
		return c.JSON(500, struct{}{})
	}

}
*/
