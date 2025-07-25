package session

import (
	"net/http"
	"time"

	"github.com/gorilla/sessions"
	echoSessionMiddleware "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/models"
)

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

	session, _ := echoSessionMiddleware.Get("sess", c)

	// 7 days
	expiration := (time.Hour * 24) * 7

	// x.Seconds()
	session.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   int(expiration.Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteNoneMode,
		Secure:   true,
		// Domain:   config.FRONTEND_BASE_URL,
	}

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

	// session.Values["email"] = user.Email
	// session.Values["name"] = user.Name
	// session.Values["picture"] = user.Picture
	// session.Values["spotifyId"] = user.SpotifyId

	err := session.Save(c.Request(), c.Response())

	return userSession, err

}

func GetUserFromSession(c echo.Context) (UserSession, error) {
	sess, err := echoSessionMiddleware.Get("sess", c)

	if err != nil {
		// If session not found, return empty UserSession
		return UserSession{}, err
	}
	// echoSessionMiddleware.Get("session", c);

	user, _ := sess.Values["user"].(UserSession)

	// email, _ := sess.Values["email"].(string)
	// name, _ := sess.Values["name"].(string)
	// picture, _ := sess.Values["picture"].(string)
	// spotifyId, _ := sess.Values["spotifyId"].(string)
	// youtubeId, _ := sess.Values["youtubeId"].(string)

	// user := UserSession{
	// 	UserId:    userId,
	// 	Email:     email,
	// 	Name:      name,
	// 	Picture:   picture,
	// 	SpotifyId: spotifyId,
	// 	YoutubeId: youtubeId,
	// }

	return user, nil
}

func SetUserSession(c echo.Context, field string, value string) error {
	// nothing yet
	session, err := echoSessionMiddleware.Get("sess", c)
	if err != nil {
		return err
	}

	session.Values["user"].(map[string]string)[field] = value

	err = session.Save(c.Request(), c.Response())

	return err
}

func ClearSession(c echo.Context) error {
	session, err := echoSessionMiddleware.Get("sess", c)
	if err != nil {
		return err
	}

	for k := range session.Values {
		delete(session.Values, k)
	}

	err = session.Save(c.Request(), c.Response())

	return err
}
