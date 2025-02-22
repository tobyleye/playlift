package session

import (
	echoSessionMiddleware "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

type UserSession struct {
	UserId    string `json:"userId"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Picture   string `json:"picture"`
	SpotifyId string `json:"spotifyId"`
	YoutubeId string `json:"youtubeId"`
}

func GetUserFromSession(c echo.Context) UserSession {

	sess, _ := echoSessionMiddleware.Get("user", c)

	userId, _ := sess.Values["userId"].(string)
	email, _ := sess.Values["email"].(string)
	name, _ := sess.Values["name"].(string)
	picture, _ := sess.Values["picture"].(string)
	spotifyId, _ := sess.Values["spotifyId"].(string)
	youtubeId, _ := sess.Values["youtubeId"].(string)

	user := UserSession{
		UserId:    userId,
		Email:     email,
		Name:      name,
		Picture:   picture,
		SpotifyId: spotifyId,
		YoutubeId: youtubeId,
	}

	return user
}

func SetUserSession(c echo.Context, field string, value string) error {
	// nothing yet
	session, _ := echoSessionMiddleware.Get("user", c)
	session.Values[field] = value
	err := session.Save(c.Request(), c.Response())
	return err

}
