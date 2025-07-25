package handlers

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/session"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	oauth2V2 "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

func (h Handlers) LoginWithGoogleCallback(c echo.Context) error {

	body := requestBodyToMap(c)

	code, _ := body["code"].(string)

	// from is the location from which the login was initiated. it is used to determine the redirect URI of the
	// oauth2 config
	// login can be initiated from the home page where the user is forced to login if not logged in
	// or it can also be initiated from the convert page where the user is trying to connect
	// their YouTube account for the first time
	from, _ := body["from"].(string)

	redirectUri := ""

	if from == "home" {
		redirectUri = config.FRONTEND_BASE_URL + "/home"
	} else {
		// else if from == "connect" {
		// default to connect
		redirectUri = config.FRONTEND_BASE_URL + "/convert/connect-youtube"
	}

	var googleLoginConfig = oauth2.Config{
		ClientID:     config.GOOGLE_CLIENT_ID,
		ClientSecret: config.GOOGLE_CLIENT_SECRET,
		Endpoint:     google.Endpoint,
		RedirectURL:  redirectUri,
		Scopes: []string{
			"https://www.googleapis.com/auth/youtube",
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
	}

	tokens, err := googleLoginConfig.Exchange(c.Request().Context(), code)

	if err != nil {
		log.Println("error exchanging google authorization code for tokens:", err)
		return c.JSON(500, map[string]string{"error": "server error"})
	}

	formattedExpiry := tokens.Expiry.Format("03:04:05PM, 02 Jan 2006")

	log.Println("Token will expire at exactly", formattedExpiry)

	httpClient := googleLoginConfig.Client(c.Request().Context(), tokens)

	oauth2service, err := oauth2V2.NewService(c.Request().Context(), option.WithHTTPClient(httpClient))

	log.Println("create oauth2service error:", err)

	userInfoService := oauth2V2.NewUserinfoService(oauth2service)
	userInfo, err := userInfoService.Get().Do()

	log.Printf("user info %+v\n", userInfo)

	if err == nil {

		var user models.User

		h.Db.Model(&models.User{}).Preload("Tokens").Where("email = ?", userInfo.Email).First(&user)

		log.Println("existing user", user)

		var userId string

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

		token := models.Token{
			UserId:       userId,
			Platform:     "youtube",
			AccessToken:  tokens.AccessToken,
			RefreshToken: tokens.RefreshToken,
			TokenType:    tokens.TokenType,
			ExpiresIn:    tokens.Expiry,
			CreatedAt:    time.Now(),
		}

		models.CreateOrUpdateTokenForUser(h.Db, userId, &token)

		log.Print("creating user session", token)
		userSession, err := session.CreateSession(c, &user)

		if err != nil {
			log.Println("error creating session", err)
			return c.JSON(500, map[string]string{"error": "server error"})
		}

		return c.JSON(200, map[string]interface{}{
			"message": "Login successful",
			"data":    userSession,
		})

	} else {
		return c.JSON(500, map[string]string{"error": "server error"})
	}

}

func (h Handlers) GetUserSession(c echo.Context) error {

	// session, _ := echoSessionMiddleware.Get("user", c)

	user, _ := session.GetUserFromSession(c)

	fmt.Printf("user: %v\n", user)

	return c.JSON(200, user)

}

func (h Handlers) Logout(c echo.Context) error {
	// clear session

	err := session.ClearSession(c)
	if err != nil {
		log.Println("error clearing session:", err)
		return c.JSON(400, map[string]string{"error": "no session found"})
	}

	return c.JSON(200, map[string]string{"message": "logged out successfully"})
}

func (h Handlers) GetConnectionStatus(c echo.Context) error {
	// a handler to check if the user has connected their spotify and youtube accounts
	// this will be used to show the connection status on the frontend
	user, _ := session.GetUserFromSession(c)
	userTokens := []models.Token{}
	h.Db.Find(&userTokens, "user_id = ?", user.UserId)

	spotifyConnected := false
	youtubeConnected := false

	if len(userTokens) > 0 {
		for _, token := range userTokens {
			if token.Platform == "spotify" {
				spotifyConnected = true
			} else if token.Platform == "youtube" {
				youtubeConnected = true
			}
		}
	}

	return c.JSON(200, map[string]bool{
		"spotify_connected": spotifyConnected,
		"youtube_connected": youtubeConnected,
	})

}
