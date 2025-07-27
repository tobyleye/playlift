package main

import (
	"fmt"
	"log"

	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/db"
	"github.com/tobyleye/playlift/services/ytmusicapi"
)

func testCreatePlaylist() error {

	db, err := db.OpenDb()

	if err != nil {
		return err
	}

	userId := "03e01533-365b-4874-976d-3d3fb03494cc"

	httpClient, err := config.CreateYoutubeClientForUser(db, userId)

	if err != nil {
		return err
	}
	fmt.Println("http client..", httpClient)

	next := ""

	_, err = ytmusicapi.FetchUserPlaylists(httpClient, next)

	// if err == nil {
	// 	// do something with the playlists
	// 	f, _ := os.Create("created-playlist.json")

	// 	defer f.Close()

	// 	return json.NewEncoder(f).Encode(playlist)

	// }

	return err
}

func main() {
	log.Fatal(testCreatePlaylist())

}
