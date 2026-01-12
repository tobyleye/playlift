package handlers

import (
	"encoding/json"
	"errors"
	"net/url"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/config"
)

type Query struct {
	Platform string
	ID       string
	Type     string
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

func parseLink(link string) (Query, error) {
	urlObj, err := url.Parse(link)
	if err != nil {
		return Query{}, err
	}

	if urlObj.Host == config.YOUTUBE_HOST {
		urlQuery := urlObj.Query()
		var queryType string
		var queryId string

		if urlObj.Path == "/playlist" {
			queryType = "playlist"
			queryId = urlQuery.Get("list")

		} else if urlObj.Path == "/watch" {
			queryType = "track"
			queryId = urlQuery.Get("v")
		}
		query := Query{Platform: YOUTUBE_MUSIC, ID: queryId, Type: queryType}
		return query, nil

	} else if urlObj.Host == config.SPOTIFY_HOST {
		path := urlObj.Path
		path = strings.TrimSpace(path)

		parts := strings.Split(path, "/")
		mediaType := parts[1]
		id := parts[2]

		query := Query{Platform: SPOTIFY, ID: id, Type: mediaType}
		return query, nil
	}

	return Query{}, errors.New("link is invalid")
}

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

func errorResponse(message string) interface{} {

	return struct {
		Error string `json:"error"`
	}{Error: message}
}

// extractPlaylistIdFromLink extracts the playlist ID from a Spotify or YouTube playlist URL
func extractPlaylistIdFromLink(link, platform string) string {
	if link == "" {
		return ""
	}

	if platform == "spotify" {
		// Spotify URL format: https://open.spotify.com/playlist/{id}
		parts := strings.Split(link, "/playlist/")
		if len(parts) >= 2 {
			// Remove query parameters if any
			id := strings.Split(parts[1], "?")[0]
			return id
		}
	} else if platform == "youtube" {
		// YouTube URL format: https://music.youtube.com/playlist?list={id}
		if strings.Contains(link, "list=") {
			parts := strings.Split(link, "list=")
			if len(parts) >= 2 {
				// Remove any additional parameters
				id := strings.Split(parts[1], "&")[0]
				return id
			}
		}
	}

	return ""
}
