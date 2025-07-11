package main

import (
	"context"
	"fmt"
	"log"

	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/db"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/services/ytmusicapi"
	"golang.org/x/oauth2"
)

func main() {

	db, err := db.OpenDb()

	if err != nil {

		fmt.Println("error opening db", err)
		log.Fatal(err)
	}

	token := models.Token{}

	db.Where(&models.Token{
		UserId:   "df6f614e-da5c-488b-8475-30f6546ec785",
		Platform: "youtube",
	}).First(&token)

	oauthToken := &oauth2.Token{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenType:    token.TokenType,
		Expiry:       token.ExpiresIn,
	}

	ctx := context.TODO()
	httpClient := config.CreateHTTPClient(ctx, oauthToken)

	playlists, err := ytmusicapi.FetchUserPlaylists(httpClient)
	fmt.Println("playlists", playlists)
	fmt.Println("hello world")
}
