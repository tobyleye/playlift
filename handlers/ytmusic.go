package handlers

import (
	"fmt"
	"log"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/services/ytmusicapi"
	"github.com/tobyleye/playlift/session"
)

func (h Handlers) FetchUserYoutubePlaylists(c echo.Context) error {

	user, _ := session.GetUserFromSession(c)

	continuation := c.QueryParam("continuation")
	fmt.Println("continuation...", continuation)
	httpClient, err := config.CreateYoutubeClientForUser(h.Db, user.UserId)

	if err != nil {
		return c.JSON(401, errorResponse("token not found"))
	}

	playlists, err := ytmusicapi.FetchUserPlaylists(httpClient, continuation)

	if err != nil {
		log.Println("error fetching youtube playlists:", err)
		return c.JSON(400, errorResponse("Couldn't fetch playlists"))
	}

	return c.JSON(200, playlists)
}
