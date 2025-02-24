package oauth

import (
	"context"
	"errors"

	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/models"
	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

var SpotifyAuthenticator = spotifyauth.New(spotifyauth.WithRedirectURL(config.SPOTIFY_CONNECT_REDIRECT_URL),
	spotifyauth.WithScopes(spotifyauth.ScopeUserReadPrivate, spotifyauth.ScopeUserLibraryRead),
	spotifyauth.WithClientID(config.SPOTIFY_CLIENT_ID),
	spotifyauth.WithClientSecret(config.SPOTIFY_CLIENT_SECRET))

func CreateSpotifyClient(token *oauth2.Token) *spotify.Client {
	client := spotify.New(SpotifyAuthenticator.Client(context.Background(), token))
	return client
}

func CreateUserSpotifyClient(db *gorm.DB, context context.Context, userId string, platform string) (*spotify.Client, error) {

	var spotifyToken models.Token

	db.Where(&models.Token{
		UserId:   userId,
		Platform: "spotify",
	}).First(&spotifyToken)

	if spotifyToken.UserId == "" {
		return nil, errors.New("no token found")
	}

	authToken := &oauth2.Token{
		RefreshToken: spotifyToken.RefreshToken,
		AccessToken:  spotifyToken.AccessToken,
		TokenType:    spotifyToken.TokenType,
		Expiry:       spotifyToken.ExpiresIn,
	}

	client := CreateSpotifyClient(authToken)

	return client, nil

}
