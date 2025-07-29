package handlers

import (
	"log"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/services/ytmusicapi"
	"github.com/tobyleye/playlift/session"
)

func (h Handlers) FetchUserYoutubePlaylists(c echo.Context) error {

	user, _ := session.GetUserFromSession(c)

	continuation := c.QueryParam("continuation")
	httpClient, err := config.CreateYoutubeClientForUser(h.Db, user.UserId)

	if err != nil {
		return c.JSON(401, errorResponse("token not found"))
	}

	playlists, err := ytmusicapi.FetchUserPlaylists(httpClient, continuation)

	if continuation == "" {
		playlistDetails, err := ytmusicapi.FetchLikedPlaylist(httpClient)
		if err == nil {
			playlists.Playlists = append([]ytmusicapi.YoutubePlaylist{playlistDetails}, playlists.Playlists...)
		} else {
			log.Println("error fetching liked playlist:", err)
		}
	}

	if err != nil {
		log.Println("error fetching youtube playlists:", err)
		return c.JSON(500, errorResponse("server error"))
	}

	return c.JSON(200, playlists)
}
