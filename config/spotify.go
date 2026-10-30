package config

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/tobyleye/playlift/models"
	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

var SpotifyAuthenticator *spotifyauth.Authenticator

func CreateSpotifyClient(token *oauth2.Token) *spotify.Client {

	// oauth2.Config{

	// }
	// httpClient := oauth2.NewClient(context.Background(), oauth2.StaticTokenSource(token))
	ctx := context.Background()

	// refresh token if needed
	// SpotifyAuthenticator.
	// refreshedToken, err := SpotifyAuthenticator.RefreshToken(ctx, token)

	// if err != nil {
	// 	fmt.Println("error refreshing spotify token:", err)

	// } else {
	// 	fmt.Printf("refreshed token: %#v\n", refreshedToken)

	// }

	fmt.Println("creating spotify client with token..", token)

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

func init() {
	fmt.Println("spotify redirect url..", SPOTIFY_CONNECT_REDIRECT_URL)
	fmt.Println("spotify client id...", SPOTIFY_CLIENT_ID)
	fmt.Println("spotify client secret...", SPOTIFY_CLIENT_SECRET)

	SpotifyAuthenticator = spotifyauth.New(
		spotifyauth.WithRedirectURL(
			os.Getenv("SPOTIFY_REDIRECT_URL"),
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

}
