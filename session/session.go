package session

import (
	"net/http"
	"os"
	"time"

	"github.com/gorilla/sessions"
	echoSessionMiddleware "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/models"
)

var SESSION_NAME = "sess"

type UserSession struct {
	UserId           string `json:"user_id"`
	Email            string `json:"email"`
	Name             string `json:"name"`
	Picture          string `json:"picture"`
	SpotifyId        string `json:"spotify_id"`
	YoutubeId        string `json:"youtube_id"`
	SpotifyConnected bool   `json:"spotify_connected"`
	YoutubeConnected bool   `json:"youtube_connected"`
}

func CreateSession(c echo.Context, user *models.User) (UserSession, error) {
	// Initialize the session for the user

	session, _ := echoSessionMiddleware.Get(SESSION_NAME, c)

	// 7 days
	expiration := (time.Hour * 24) * 7

	isProduction := os.Getenv("GO_ENV") == "production"

	sessionOptions := &sessions.Options{
		Path:     "/",
		MaxAge:   int(expiration.Seconds()),
		HttpOnly: true,
	}
	// enable cookies to be ready by both localhost & 127.0.0.1.
	if !isProduction {
		sessionOptions.SameSite = http.SameSiteNoneMode
		sessionOptions.Secure = true
	}

	session.Options = sessionOptions

	// since this function is called after login with youtube
	// we set youtubeConnect to true
	youtubeConnected := true

	var spotifyConnected bool

	if len(user.Tokens) > 0 {
		for _, token := range user.Tokens {
			if token.Platform == "spotify" {
				spotifyConnected = true
			}
		}
	}

	userSession := UserSession{
		UserId:           user.UserId,
		Email:            user.Email,
		Name:             user.Name,
		Picture:          user.Picture,
		SpotifyId:        user.SpotifyId,
		YoutubeId:        user.YoutubeId,
		SpotifyConnected: spotifyConnected,
		YoutubeConnected: youtubeConnected,
	}

	session.Values["user"] = userSession

	err := session.Save(c.Request(), c.Response())

	return userSession, err

}

func GetUserFromSession(c echo.Context) (UserSession, error) {
	sess, err := echoSessionMiddleware.Get(SESSION_NAME, c)

	if err != nil {
		// If session not found, return empty UserSession
		return UserSession{}, err
	}
	// echoSessionMiddleware.Get("session", c);

	user, _ := sess.Values["user"].(UserSession)

	return user, nil
}

func UpdateSession(c echo.Context, user UserSession) error {
	session, err := echoSessionMiddleware.Get(SESSION_NAME, c)
	if err != nil {
		return err
	}

	session.Values["user"] = user

	err = session.Save(c.Request(), c.Response())

	return err
}

func ClearSession(c echo.Context) error {
	session, err := echoSessionMiddleware.Get(SESSION_NAME, c)

	if err != nil {
		return err
	}

	for k := range session.Values {
		delete(session.Values, k)
	}

	session.Options.MaxAge = -1

	err = session.Save(c.Request(), c.Response())

	return err
}
