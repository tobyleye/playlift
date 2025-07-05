package session

import (
	"fmt"

	"github.com/gorilla/sessions"
	echoSessionMiddleware "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlist-converter/models"
)

type UserSession struct {
	UserId           string `json:"userId"`
	Email            string `json:"email"`
	Name             string `json:"name"`
	Picture          string `json:"picture"`
	SpotifyId        string `json:"spotifyId"`
	YoutubeId        string `json:"youtubeId"`
	SpotifyConnected bool   `json:"spotifyConnected"`
	YoutubeConnected bool   `json:"youtubeConnected"`
}

func CreateSession(c echo.Context, user *models.User) error {
	// Initialize the session for the user
	fmt.Println("Initializing session for user...")
	session, _ := echoSessionMiddleware.Get("user", c)

	session.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 2, // 2 days
		HttpOnly: true,
	}

	var spotifyConnected bool
	var youtubeConnected bool

	if len(user.Tokens) > 0 {
		for _, token := range user.Tokens {

			if token.Platform == "spotify" {
				spotifyConnected = true
			}
			if token.Platform == "youtube_music" {
				youtubeConnected = true
			}
		}
	}

	// session.
	session.Values["user"] = UserSession{
		UserId:           user.UserId,
		Email:            user.Email,
		Name:             user.Name,
		Picture:          user.Picture,
		SpotifyId:        user.SpotifyId,
		YoutubeId:        user.YoutubeId,
		SpotifyConnected: spotifyConnected,
		YoutubeConnected: youtubeConnected,
	}

	// session.Values["email"] = user.Email
	// session.Values["name"] = user.Name
	// session.Values["picture"] = user.Picture
	// session.Values["spotifyId"] = user.SpotifyId

	// get user tokens here and verify user

	err := session.Save(c.Request(), c.Response())

	return err

}

func GetUserFromSession(c echo.Context) UserSession {
	sess, _ := echoSessionMiddleware.Get("user", c)

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

	return user
}

func SetUserSession(c echo.Context, field string, value string) error {
	// nothing yet
	session, _ := echoSessionMiddleware.Get("user", c)
	session.Values[field] = value
	err := session.Save(c.Request(), c.Response())
	return err

}
