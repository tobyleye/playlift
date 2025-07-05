package handlers

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	"github.com/tobyleye/playlist-converter/session"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	oauth2V2 "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

func (h Handlers) LoginWithGoogleCallback(c echo.Context) error {

	body := requestBodyToMap(c)

	code, _ := body["code"].(string)

	var googleLoginConfig = oauth2.Config{
		ClientID:     config.GOOGLE_CLIENT_ID,
		ClientSecret: config.GOOGLE_CLIENT_SECRET,
		Endpoint:     google.Endpoint,
		RedirectURL:  config.GOOGLE_LOGIN_REDIRECT_URL,
		Scopes: []string{
			"https://www.googleapis.com/auth/youtube",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
	}

	tokens, err := googleLoginConfig.Exchange(c.Request().Context(), code)
	// fmt.Println("tokens..", tokens)

	if err != nil {
		fmt.Printf("err: %v\n", err)
		return c.JSON(500, map[string]string{"error": "server error"})
	} else {

		formattedExpiry := tokens.Expiry.Format("03:04:05PM, 02 Jan 2006")

		fmt.Println("Token will expire at exactly", formattedExpiry)
		// fmt.Println("Token refresh tokens", tokens.RefreshToken)

		httpClient := googleLoginConfig.Client(c.Request().Context(), tokens)

		oauth2service, err := oauth2V2.NewService(c.Request().Context(), option.WithHTTPClient(httpClient))

		fmt.Println("service error -", err)
		userInfoService := oauth2V2.NewUserinfoService(oauth2service)
		userInfo, err := userInfoService.Get().Do()

		if err == nil {

			var user *models.User
			h.Db.Model(&models.User{}).Preload("Tokens").Where("email = ?", userInfo.Email).First(user)

			fmt.Println("existing user", user)

			var userId string

			fmt.Println("found user:", user)

			if user.UserId == "" {
				// create user

				userId = uuid.New().String()

				user := &models.User{
					UserId:    userId,
					Email:     userInfo.Email,
					Name:      userInfo.Name,
					Picture:   userInfo.Picture,
					YoutubeId: userInfo.Id,
					CreatedAt: time.Now(),
				}

				h.Db.Create(user)

			} else {
				userId = user.UserId

			}

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

			err := session.CreateSession(c, user)

			if err != nil {
				fmt.Println("error creating session", err)
				return c.JSON(500, map[string]string{"error": "server error"})
			}

			// session, _ := echoSessionMiddleware.Get("user", c)
			// session.Options = &sessions.Options{
			// 	Path:     "/",
			// 	MaxAge:   86400 * 2, // 2 days
			// 	HttpOnly: true,
			// }

			// // session.
			// session.Values["userId"] = userId
			// session.Values["email"] = userInfo.Email
			// session.Values["name"] = userInfo.Name
			// session.Values["picture"] = userInfo.Picture

			// get user tokens here and verify user

			// err = session.Save(c.Request(), c.Response())

			return c.JSON(200, map[string]interface{}{
				"message": "Login successful",
				"data": map[string]interface{}{
					"user_id": userId,
					"name":    userInfo.Name,
					"email":   userInfo.Email,
					"picture": userInfo.Picture,
				},
			})

		} else {
			return c.JSON(500, map[string]string{"error": "server error"})
		}

	}

}

func (h Handlers) GetUserSession(c echo.Context) error {

	// session, _ := echoSessionMiddleware.Get("user", c)

	user := session.GetUserFromSession(c)

	fmt.Printf("user: %v\n", user)

	return c.JSON(200, user)

}

func (h Handlers) Logout(c echo.Context) error {
	// Todo:
	// clear sessions obviously
	return nil
}
