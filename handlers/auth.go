package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
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

func getUserGoogleInfo(context context.Context, client *http.Client) (*oauth2V2.Userinfo, error) {

	oauth2service, err := oauth2V2.NewService(context, option.WithHTTPClient(client))

	if err != nil {
		return nil, err
	}

	userInfo, err := oauth2service.Userinfo.Get().Do()

	if err != nil {
		return nil, err
	}

	return userInfo, nil

}

func (h Handlers) LoginWithGoogleCallback(c echo.Context) error {

	body := requestBodyToMap(c)

	code, _ := body["code"].(string)

	// origin is the location from which the login was initiated. it is used to determine the redirect URI of the
	// oauth2 config
	// login can be initiated from the "login" page where the user is forced to login if not logged in
	// or it can also be initiated from the youtube "connect" page where the user is trying to connect
	// their YouTube account
	// origin, _ := body["origin"].(string)

	// Changed the ux_mode from redirect to popup and
	// i think this way we can just use the base url of the frontend as
	// the redirect uri
	redirectURL, _ := body["redirect_url"].(string)

	log.Println("user logging in with google, redirect uri:", body, code)

	// if origin == "login" {
	// 	redirectUri = config.FRONTEND_BASE_URL

	// } else {
	// 	// else if from == "connect" {
	// 	// default to connect

	// 	redirectUri = config.FRONTEND_BASE_URL + "/convert/connect-youtube"
	// }

	var googleLoginConfig = oauth2.Config{
		ClientID:     config.GOOGLE_CLIENT_ID,
		ClientSecret: config.GOOGLE_CLIENT_SECRET,
		Endpoint:     google.Endpoint,
		RedirectURL:  redirectURL,
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

	userInfo, err := getUserGoogleInfo(c.Request().Context(), httpClient)

	if err != nil {
		log.Println("error getting user info from google:", err)
		return c.JSON(500, errorResponse("server error"))
	}

	user := new(models.User)

	h.Db.Model(&models.User{}).Preload("Tokens").Where("email = ?", userInfo.Email).First(user)

	userId := user.UserId

	isNewUser := userId == ""

	if isNewUser {
		// create user

		userId = uuid.New().String()

		user = &models.User{
			UserId:    userId,
			Email:     userInfo.Email,
			Name:      userInfo.Name,
			Picture:   userInfo.Picture,
			YoutubeId: userInfo.Id,
			CreatedAt: time.Now(),
		}

		h.Db.Create(user)
	}

	// upsert token

	token := models.Token{
		UserId:       userId,
		Platform:     "youtube",
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		TokenType:    tokens.TokenType,
		ExpiresIn:    tokens.Expiry,
		CreatedAt:    time.Now(),
	}

	models.UpsertTokenForUser(h.Db, &token)

	userSession, err := session.CreateSession(c, user)

	if err != nil {
		log.Println("error creating session", err)
		return c.JSON(500, map[string]string{"error": "server error"})
	}

	fmt.Println("session created...", userSession)

	return c.JSON(200, map[string]interface{}{
		"message": "Login successful",
		"data": map[string]interface{}{
			"user":        userSession,
			"is_new_user": isNewUser,
		},
	})

}

func (h Handlers) GetUserSession(c echo.Context) error {

	// session, _ := echoSessionMiddleware.Get("user", c)

	user, _ := session.GetUserFromSession(c)

	return c.JSON(200, user)

}

func (h Handlers) Logout(c echo.Context) error {
	// clear session

	err := session.ClearSession(c)

	if err != nil {
		log.Println("error clearing session:", err)
		return c.JSON(500, map[string]string{"error": "server error"})
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
