package handlers

import (
	"errors"
	"net/url"
	"strings"

	"github.com/tobyleye/playlist-converter/config"
)

type Query struct {
	Platform string
	ID       string
	Type     string
}

func ParseLink(link string) (Query, error) {
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
