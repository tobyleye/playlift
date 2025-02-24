package oauth

import (
	"context"
	"errors"
	"net/http"

	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

var GoogleOauthConfig = oauth2.Config{
	ClientID:     config.GOOGLE_CLIENT_ID,
	ClientSecret: config.GOOGLE_CLIENT_SECRET,
	Endpoint:     google.Endpoint,
	RedirectURL:  config.GOOGLE_CONNECT_REDIRECT_URL,
	Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/youtube"},
}

func CreateHTTPClient(ctx context.Context, token *oauth2.Token) *http.Client {
	return GoogleOauthConfig.Client(ctx, token)
}

func CreateYoutubeClient(db *gorm.DB, userId string) (*http.Client, error) {

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
