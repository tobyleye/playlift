package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	spotify_service "github.com/tobyleye/playlist-converter/services/spotify"
	"github.com/tobyleye/playlist-converter/session"
	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2"
)

var redirectURL = "http://localhost:8181/callback/spotify"

var auth = spotifyauth.New(spotifyauth.WithRedirectURL(redirectURL),
	spotifyauth.WithScopes(spotifyauth.ScopeUserReadPrivate, spotifyauth.ScopeUserLibraryRead),
	spotifyauth.WithClientID(config.SPOTIFY_CLIENT_ID),
	spotifyauth.WithClientSecret(config.SPOTIFY_CLIENT_SECRET))

func (h Handlers) SpotifyLogin(c echo.Context) error {

	url := auth.AuthURL("state")
	return c.Redirect(302, url)
}

func (h Handlers) SpotifyLoginCallback(c echo.Context) error {
	user := session.GetUserFromSession(c)

	token, err := auth.Token(c.Request().Context(), "state", c.Request())

	if err != nil {
		return c.HTML(http.StatusNotFound, "Couldn't get token")
	}

	fmt.Println("spotify login token --->", token)

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

	redirectUrl := config.FRONTEND_BASE_URL + "/convert-playlist"

	return c.Redirect(301, redirectUrl)
}

func (h Handlers) FetchUserSpotifyPlaylists(c echo.Context) error {
	// models.Token{}
	user := session.GetUserFromSession(c)

	var spotifyToken models.Token

	h.Db.Where(&models.Token{
		UserId:   user.UserId,
		Platform: "spotify",
	}).First(&spotifyToken)

	if spotifyToken.UserId == "" {
		return c.JSON(401, "unauthorized")
	}

	authToken := oauth2.Token{
		RefreshToken: spotifyToken.RefreshToken,
		AccessToken:  spotifyToken.AccessToken,
		TokenType:    spotifyToken.TokenType,
		Expiry:       spotifyToken.ExpiresIn,
	}

	client := spotify.New(auth.Client(c.Request().Context(), &authToken))
	ctx := context.Background()

	playlists, _ := spotify_service.GetUserPlaylists(client, ctx)

	return c.JSON(200, playlists)

}
