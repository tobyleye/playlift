package config

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/tobyleye/playlist-converter/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

var GoogleOauthConfig = oauth2.Config{
	ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
	ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	Endpoint:     google.Endpoint,
	RedirectURL:  os.Getenv("FRONTEND_BASE_URL") + "/convert/connect-youtube",
	Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/youtube"},
}

func CreateHTTPClient(ctx context.Context, token *oauth2.Token) *http.Client {

	// tokenSource := GoogleOauthConfig.TokenSource(ctx, token)
	// refreshedtoken, err := tokenSource.Token()
	fmt.Printf("google config %#v\n", GoogleOauthConfig)
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

	// fmt.Println("google client id::", GOOGLE_CLIENT_ID)

	var token models.Token

	db.Where(&models.Token{
		UserId:   userId,
		Platform: "youtube",
	}).First(&token)

	if token.UserId == "" {
		return nil, errors.New("no token found")
	}

	fmt.Printf("found token for user.. %#v\n", token)

	oauthToken := &oauth2.Token{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.ExpiresIn,
	}

	httpClient := CreateHTTPClient(context.Background(), oauthToken)

	return httpClient, nil
}
