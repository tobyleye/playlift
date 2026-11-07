package core

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/tobyleye/playlift/config"
	"github.com/zmb3/spotify/v2"
	"golang.org/x/oauth2"
)

type AppSpotifyClient struct {
	clientId        string
	clientSecret    string
	client          *spotify.Client
	isAuthenticated bool
	tok             struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
}

func (sc *AppSpotifyClient) Authenticate() error {

	if sc.isAuthenticated {
		return nil
	}

	form := url.Values{}
	form.Set("grant_type", "client_credentials")

	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}

	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(sc.clientId, sc.clientSecret)

	resp, err := http.DefaultClient.Do(req)

	b, err := io.ReadAll(resp.Body)

	if err != nil {
		return err
	}

	if err := json.Unmarshal(b, &sc.tok); err != nil { /* ... */
	}

	httpClient := oauth2.NewClient(context.TODO(),
		oauth2.StaticTokenSource(&oauth2.Token{AccessToken: sc.tok.AccessToken}))
	sc.client = spotify.New(httpClient)
	sc.isAuthenticated = true
	return nil
}

func (sc *AppSpotifyClient) GetPlaylist(playlistId string) (*spotify.FullPlaylist, error) {
	err := sc.Authenticate()
	if err != nil {
		return nil, err
	}
	playlist, err := sc.client.GetPlaylist(context.TODO(), spotify.ID(playlistId))

	return playlist, err
}

func NewAppSpotifyClient() *AppSpotifyClient {
	return &AppSpotifyClient{
		clientId:     config.SPOTIFY_CLIENT_ID,
		clientSecret: config.SPOTIFY_CLIENT_SECRET,
	}
}
