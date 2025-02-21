package handlers

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	oauth2_v2 "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

var googleLoginConfig = oauth2.Config{
	ClientID:     config.GOOGLE_CLIENT_ID,
	ClientSecret: config.GOOGLE_CLIENT_SECRET,
	Endpoint:     google.Endpoint,
	RedirectURL:  config.GOOGLE_LOGIN_REDIRECT_URL,
	Scopes: []string{
		"https://www.googleapis.com/auth/youtube",
		"https://www.googleapis.com/auth/userinfo.email",
		// "https://www.googleapis.com/auth/userinfo.profile",
	},
}

func (h Handlers) LoginWithGoogle(c echo.Context) error {

	url := googleLoginConfig.AuthCodeURL("state", oauth2.AccessTypeOffline, oauth2.ApprovalForce)

	return c.Redirect(302, url)
}

func (h Handlers) LoginWithGoogleCallback(c echo.Context) error {

	code := c.QueryParam("code")

	tokens, err := googleLoginConfig.Exchange(c.Request().Context(), code)
	// fmt.Printf("tokens: %v\n", tokens)

	// fmt.Println("access token -->", tokens.RefreshToken)

	if err != nil {
		fmt.Printf("err: %v\n", err)
		redirectUrl := config.FRONTEND_BASE_URL + "/home?loginError=true"
		return c.Redirect(301, redirectUrl)
	} else {

		formattedExpiry := tokens.Expiry.Format("03:04:05PM, 02 Jan 2006")

		fmt.Println("Token will expire at exactly", formattedExpiry)
		fmt.Println("Token refresh tokens", tokens.RefreshToken)

		httpClient := googleLoginConfig.Client(c.Request().Context(), tokens)

		oauth2service, err := oauth2_v2.NewService(c.Request().Context(), option.WithHTTPClient(httpClient))

		fmt.Println("service error -", err)
		userInfoService := oauth2_v2.NewUserinfoService(oauth2service)
		userInfo, err := userInfoService.Get().Do()

		if err == nil {

			var existingUser models.User
			h.Db.Where("email = ?", userInfo.Email).First(&existingUser)

			fmt.Println("existing user", existingUser)

			var userId string
			if existingUser.UserId == "" {
				// create user

				userId = uuid.New().String()

				user := models.User{
					UserId:    userId,
					Email:     userInfo.Email,
					Name:      userInfo.Name,
					Picture:   userInfo.Picture,
					CreatedAt: time.Now(),
				}

				h.Db.Create(&user)

			} else {
				userId = existingUser.UserId
			}

			fmt.Println("tokens::", tokens)

			token := &models.Token{
				UserId:       userId,
				Platform:     "youtube",
				AccessToken:  tokens.AccessToken,
				RefreshToken: tokens.RefreshToken,
				TokenType:    tokens.TokenType,
				ExpiresIn:    tokens.Expiry,
				CreatedAt:    time.Now(),
			}

			models.CreateOrUpdateTokenForUser(h.Db, userId, token)

			fmt.Print("new token", token)

			session, _ := session.Get("user", c)
			// session.Options = &sessions.Options{
			// 	Path:     "/",
			// 	MaxAge:   86400 * 7,
			// 	HttpOnly: true,
			// }

			session.Values["userId"] = userId
			session.Values["email"] = userInfo.Email
			session.Values["name"] = userInfo.Name
			session.Values["picture"] = userInfo.Picture

			err = session.Save(c.Request(), c.Response())

			fmt.Println("session save error", err)

			redirectUrl := config.FRONTEND_BASE_URL + "/home"
			return c.Redirect(301, redirectUrl)
		}

		return c.Redirect(301, config.FRONTEND_BASE_URL+"/home?loginError=true")

	}
}

func (h Handlers) GetUserSession(c echo.Context) error {

	session, _ := session.Get("user", c)

	user := make(map[string]interface{})

	user["userId"] = session.Values["userId"]
	user["email"] = session.Values["email"]
	user["name"] = session.Values["name"]
	user["userId"] = session.Values["userId"]
	user["picture"] = session.Values["picture"]

	fmt.Printf("user: %v\n", user)

	return c.JSON(200, user)

}
