package config

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/tobyleye/playlist-converter/models"
	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

var SpotifyAuthenticator = spotifyauth.New(
	spotifyauth.WithRedirectURL(

		os.Getenv("FRONTEND_BASE_URL")+"/convert/connect-spotify",
	),
	spotifyauth.WithScopes(
		spotifyauth.ScopeUserReadEmail,
		spotifyauth.ScopePlaylistReadPrivate,
		spotifyauth.ScopePlaylistModifyPrivate,
		spotifyauth.ScopePlaylistModifyPublic,
		spotifyauth.ScopeUserLibraryRead,
		spotifyauth.ScopeUserLibraryModify,
	),
	spotifyauth.WithClientID(
		os.Getenv("SPOTIFY_CLIENT_ID"),
	),
	spotifyauth.WithClientSecret(
		os.Getenv("SPOTIFY_CLIENT_SECRET"),
	),
)

func CreateSpotifyClient(token *oauth2.Token) *spotify.Client {

	// oauth2.Config{

	// }
	// httpClient := oauth2.NewClient(context.Background(), oauth2.StaticTokenSource(token))
	ctx := context.Background()

	fmt.Printf("current token: %#v\n", token)

	// refresh token if needed
	// SpotifyAuthenticator.
	// token, err := SpotifyAuthenticator.RefreshToken(ctx, token)

	// fmt.Println("error refreshing spotify token:", err)
	// fmt.Printf("refreshed token: %#v\n", token)

	httpClient := SpotifyAuthenticator.Client(ctx, token)

	client := spotify.New(
		httpClient,
		// The API will throttle requests if sending them too rapidly.
		// WithRetry configures the client to wait and re-attempt the request.
		spotify.WithRetry(true),
	)
	return client
}

func CreateUserSpotifyClient(db *gorm.DB, userId string) (*spotify.Client, error) {

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
