package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	"github.com/tobyleye/playlist-converter/services/ytmusicapi"
	"github.com/tobyleye/playlist-converter/session"
)

// http://localhost:8181/callback/google

func (h Handlers) YoutubeConnectCallback(c echo.Context) error {
	code := c.QueryParam("code")

	user := session.GetUserFromSession(c)

	tokens, err := config.GoogleOauthConfig.Exchange(c.Request().Context(), code)
	fmt.Printf("tokens: %v\n", tokens)
	fmt.Printf("tokens refresh token: %v\n", tokens.RefreshToken)

	if err != nil {
		return c.HTML(http.StatusInternalServerError, "Couldn't get token")
	} else {

		token := models.Token{
			UserId:       user.UserId,
			Platform:     "youtube",
			AccessToken:  tokens.AccessToken,
			RefreshToken: tokens.RefreshToken,
			TokenType:    tokens.TokenType,
			ExpiresIn:    tokens.Expiry,
			CreatedAt:    time.Now(),
		}

		err := models.CreateOrUpdateTokenForUser(h.Db, user.UserId, &token)
		log.Println("error creating or updating token:", err)

		redirectUrl := "/convert-playlist"
		return c.Redirect(301, redirectUrl)
	}
}

func (h Handlers) FetchUserYoutubePlaylists(c echo.Context) error {

	user := session.GetUserFromSession(c)
	fmt.Println("fetching youtube playlists for user:", user.UserId)
	httpClient, err := config.CreateYoutubeClientForUser(h.Db, user.UserId)

	if err != nil {
		return c.JSON(401, "token not  missing")
	}

	playlists, err := ytmusicapi.FetchUserPlaylists(httpClient)

	if err != nil {
		log.Println("fetch playlist error:", err)
		return c.JSON(400, "Couldn't fetch playlists")
	}

	return c.JSON(200, playlists)
}
