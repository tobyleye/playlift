package config

import (
	"context"
	"errors"
	"net/http"

	"github.com/tobyleye/playlift/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

func GetGoogleOauthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     GOOGLE_CLIENT_ID,
		ClientSecret: GOOGLE_CLIENT_SECRET,
		Endpoint:     google.Endpoint,
		RedirectURL:  FRONTEND_BASE_URL + "/convert/connect-youtube",
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/youtube"},
	}
}

func CreateHTTPClient(ctx context.Context, token *oauth2.Token) *http.Client {

	var GoogleOauthConfig = GetGoogleOauthConfig()

	// tokenSource := GoogleOauthConfig.TokenSource(ctx, token)
	// fmt.Println("current time:", time.Now())
	// fmt.Println("refreshed token:", refreshedtoken)
	// fmt.Println("refreshed token err:", err)

	// google.
	// client := oauth2.NewClient(ctx, tokenSource)

	// token.
	client := GoogleOauthConfig.Client(ctx, token)

	return client
}

func CreateYoutubeClientForUser(db *gorm.DB, userId string) (*http.Client, error) {

	var token models.Token

	db.Where(&models.Token{
		UserId:   userId,
		Platform: "youtube",
	}).First(&token)

	if token.UserId == "" {
		return nil, errors.New("no token found")
	}

	oauthToken := &oauth2.Token{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.ExpiresIn,
	}

	httpClient := CreateHTTPClient(context.Background(), oauthToken)

	return httpClient, nil
}
