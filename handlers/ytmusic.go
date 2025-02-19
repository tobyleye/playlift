package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	"github.com/tobyleye/playlist-converter/services/ytmusicapi"
	"github.com/tobyleye/playlist-converter/session"
	"github.com/tobyleye/playlist-converter/utils"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleConnectConfig = oauth2.Config{
	ClientID:     config.GOOGLE_CLIENT_ID,
	ClientSecret: config.GOOGLE_CLIENT_SECRET,
	Endpoint:     google.Endpoint,
	RedirectURL:  "http://localhost:8181/callback/youtube",
	Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/youtube"},
}

func (h Handlers) YoutubeLogin(c echo.Context) error {

	url := utils.GoogleConnectConfig.AuthCodeURL("state")

	return c.Redirect(302, url)
}

func (h Handlers) YoutubeLoginCallback(c echo.Context) error {
	code := c.QueryParam("code")

	user := session.GetUserFromSession(c)

	tokens, err := utils.GoogleConnectConfig.Exchange(c.Request().Context(), code)
	fmt.Printf("tokens: %v\n", tokens)
	fmt.Printf("tokens refresh token: %v\n", tokens.RefreshToken)

	if err != nil {
		return c.HTML(http.StatusInternalServerError, "Couldn't get token")
	} else {

		token := models.Token{
			UserId:       user.UserId,
			Platform:     "youtube",
			AccessToken:  tokens.AccessToken,
			RefreshToken: tokens.RefreshToken,
			TokenType:    tokens.TokenType,
			ExpiresIn:    tokens.Expiry,
			CreatedAt:    time.Now(),
		}

		err := models.CreateOrUpdateTokenForUser(h.Db, user.UserId, &token)
		log.Println("error creating or updating token:", err)

		redirectUrl := config.FRONTEND_BASE_URL + "/convert-playlist"
		return c.Redirect(301, redirectUrl)
	}
}

func (h Handlers) FetchUserYoutubePlaylists(c echo.Context) error {
	var token models.Token

	user := session.GetUserFromSession(c)

	fmt.Println("getting playlist for user:", user)

	h.Db.Where(&models.Token{
		UserId:   user.UserId,
		Platform: "youtube",
	}).First(&token)

	if token.UserId == "" {
		return c.JSON(401, "unauthorized")
	}

	oauthToken := &oauth2.Token{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.ExpiresIn,
	}

	// tokenSource := googleConnectConfig.TokenSource(c.Request().Context(), oauthToken)
	// newToken, err := tokenSource.Token()
	// if err != nil {
	// 	log.Println("Token refresh failed:", err)
	// }

	// log.Println("new token:", newToken)
	// fmt.Println("oauth token:", oauthToken)
	// httpClient := oauth2.NewClient(c.Request().Context(), tokenSource)

	httpClient := utils.CreateHTTPClient(c.Request().Context(), oauthToken)

	// service, _ := youtube.NewService(c.Request().Context(), option.WithHTTPClient(httpClient))
	// playlists, err := service.Playlists.List([]string{"contentDetails", "snippet"}).Mine(true).MaxResults(50).Do()

	playlists, err := ytmusicapi.FetchUserPlaylists(httpClient)

	if err != nil {
		fmt.Println("fetch playlist error:", err)
		return c.JSON(400, "Couldn't fetch playlists")
	}

	return c.JSON(200, playlists)
}
