package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	"github.com/tobyleye/playlist-converter/oauth"
	spotify_service "github.com/tobyleye/playlist-converter/services/spotify"
	"github.com/tobyleye/playlist-converter/session"
)

func (h Handlers) SpotifyLogin(c echo.Context) error {

	url := oauth.SpotifyAuthenticator.AuthURL("state")
	return c.Redirect(302, url)
}

func (h Handlers) SpotifyLoginCallback(c echo.Context) error {
	user := session.GetUserFromSession(c)

	token, err := oauth.SpotifyAuthenticator.Token(c.Request().Context(), "state", c.Request())

	if err != nil {
		return c.HTML(http.StatusNotFound, "Couldn't get token")
	}

	spotifyToken := models.Token{
		UserId:       user.UserId,
		Platform:     "spotify",
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		ExpiresIn:    token.Expiry,
		CreatedAt:    time.Now(),
	}

	result := h.Db.Create(&spotifyToken)

	if result.Error != nil {
		return c.String(500, "Something went wrong")
	}

	spotifyClient := oauth.CreateSpotifyClient(token)

	if user.SpotifyId == "" {

		spotifyUser, _ := spotifyClient.CurrentUser(c.Request().Context())
		// set spotifyId if not provided
		h.Db.Model(&models.User{}).Where("user_id = ?", user.UserId).Update("spotify_id", spotifyUser.ID)
		err := session.SetUserSession(c, "spotifyId", spotifyUser.ID)
		log.Printf("error setting user %s session %v\n", user.UserId, err)
	}

	redirectUrl := config.FRONTEND_BASE_URL + "/convert-playlist"

	return c.Redirect(301, redirectUrl)
}

func (h Handlers) FetchUserSpotifyPlaylists(c echo.Context) error {
	user := session.GetUserFromSession(c)

	spotifyClient, err := oauth.CreateUserSpotifyClient(h.Db, c.Request().Context(), user.UserId, "spotify")
	if err != nil {
		return c.JSON(400, "token not found")
	}

	ctx := context.Background()
	playlists, _ := spotify_service.GetUserPlaylists(spotifyClient, ctx)

	return c.JSON(200, playlists)

}
