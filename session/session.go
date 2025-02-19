package session

import (
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

type UserSession struct {
	UserId  string `json:"userId"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func GetUserFromSession(c echo.Context) UserSession {

	sess, _ := session.Get("user", c)

	user := UserSession{
		UserId:  sess.Values["userId"].(string),
		Email:   sess.Values["email"].(string),
		Name:    sess.Values["name"].(string),
		Picture: sess.Values["picture"].(string),
	}

	return user
}

func SetLoginSession(c echo.Context) {
	// nothing yet
}
