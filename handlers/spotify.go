package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/session"
	"github.com/tobyleye/playlift/types"
	"github.com/tobyleye/playlift/utils"
	"github.com/zmb3/spotify/v2"
	"golang.org/x/oauth2"
)

// SpotifyTokenResponse represents the response from Spotify's token endpoint
type SpotifyTokenResponse struct {
	AccessToken  string    `json:"access_token"`
	TokenType    string    `json:"token_type"`
	ExpiresIn    time.Time `json:"expires_in"`
	RefreshToken string    `json:"refresh_token"`
	Scope        string    `json:"scope"`
}

// SpotifyTokenExchange makes a direct HTTP request to Spotify's token endpoint
func SpotifyTokenExchange(code string) (*oauth2.Token, error) {

	redirectURI := config.SPOTIFY_CONNECT_REDIRECT_URL
	clientID := config.SPOTIFY_CLIENT_ID
	clientSecret := config.SPOTIFY_CLIENT_SECRET

	log.Println("exchanging spotify token..")
	log.Println(map[string]string{redirectURI: redirectURI, clientID: clientID, clientSecret: clientSecret, code: code})

	// Prepare the form data
	formData := url.Values{}
	formData.Set("code", code)
	formData.Set("redirect_uri", redirectURI)
	formData.Set("grant_type", "authorization_code")

	// Create the request
	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(formData.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	// Create basic auth header
	auth := base64.StdEncoding.EncodeToString([]byte(clientID + ":" + clientSecret))
	req.Header.Set("Authorization", "Basic "+auth)

	// Make the request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("spotify API returned status %d", resp.StatusCode)
	}

	// Parse the response
	var tokenResponse oauth2.Token
	if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &tokenResponse, nil
}

func GetUserPlaylists(ctx context.Context, client *spotify.Client, page int) (types.SpotifyPlaylistPage, error) {

	page = utils.Max(1, page)

	limit := 50
	offset := (page - 1) * limit

	playlists, err := client.CurrentUsersPlaylists(ctx, spotify.Limit(limit), spotify.Offset(offset))

	if err != nil {
		return types.SpotifyPlaylistPage{}, err
	}

	var nextPage int = -1

	if playlists.Next != "" {
		nextPage = page + 1
	}

	playlistPage := types.SpotifyPlaylistPage{
		TotalCount: int(playlists.Total),
		Playlists:  []types.SimplePlaylistPageItem{},
		NextPage:   nextPage,
	}

	for _, p := range playlists.Playlists {
		images := []string{}
		for _, i := range p.Images {
			images = append(images, i.URL)
		}
		playlist := types.SimplePlaylistPageItem{

			Url:         p.ExternalURLs["spotify"],
			Title:       p.Name,
			Description: p.Description,
			TotalTracks: int(p.Tracks.Total),
			Thumbnails:  images,
			PlaylistId:  string(p.ID),
		}

		playlistPage.Playlists = append(playlistPage.Playlists, playlist)
	}

	return playlistPage, nil

}

func (h Handlers) SpotifyLoginCallback(c echo.Context) error {
	user, _ := session.GetUserFromSession(c)

	body := requestBodyToMap(c)
	code, _ := body["code"].(string)

	// this didn't work for some reason so we just made a direct request to the spotify token endpoint
	// tokens, err := oauth.SpotifyAuthenticator.Exchange(c.Request().Context(), code)

	tokens, err := SpotifyTokenExchange(code)

	if err != nil {
		log.Println("error fetching spotify token:", err)
		return c.JSON(500, errorResponse("Couldn't get token"))
	}

	spotifyToken := models.Token{
		UserId:       user.UserId,
		Platform:     "spotify",
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		TokenType:    tokens.TokenType,
		ExpiresIn:    time.Now().Add(time.Second * time.Duration(tokens.ExpiresIn)),
		CreatedAt:    time.Now(),
	}

	result := h.Db.Create(&spotifyToken)

	if result.Error != nil {
		log.Println("error adding spotify token in db", result.Error)
		return c.JSON(500, errorResponse("internal server error"))
	}

	spotifyClient := config.CreateSpotifyClient(tokens)

	spotifyUser, err := spotifyClient.CurrentUser(c.Request().Context())

	if err != nil {
		log.Println("error fetching spotify user:", err)
		return c.JSON(http.StatusInternalServerError, errorResponse("Couldn't get user"))
	}

	h.Db.Model(&models.User{}).Where("user_id = ?", user.UserId).Update("spotify_id", spotifyUser.ID)

	user.SpotifyId = spotifyUser.ID
	err = session.UpdateSession(c, user)

	if err != nil {
		log.Printf("error setting user %s session %v\n", user.UserId, err)
	}

	return c.JSON(200, "successfully connected to spotify")
}

func (h Handlers) FetchUserSpotifyPlaylists(c echo.Context) error {
	user, _ := session.GetUserFromSession(c)

	spotifyClient, err := config.CreateUserSpotifyClient(h.Db, user.UserId)
	if err != nil {
		return c.JSON(403, errorResponse("error creating spotify client"))
	}

	page, err := strconv.Atoi(c.QueryParam("page"))

	if err != nil {
		page = 1
	}

	ctx := context.Background()
	playlists, err := GetUserPlaylists(ctx, spotifyClient, page)
	if page == 1 {
		// Fetch liked songs playlist and add it to the top of the list
		likedPlaylist, err := spotifyClient.CurrentUsersTracks(ctx, spotify.Limit(1))
		if err == nil {
			formattedLikedPlaylist := types.SimplePlaylistPageItem{
				Url:         "https://open.spotify.com/collection/tracks", // kinda like fixed for everyone
				Title:       "Liked Music",
				Description: "Your liked songs on Spotify",
				TotalTracks: int(likedPlaylist.Total),
				Thumbnails:  []string{},
				PlaylistId:  "LM",
			}
			playlists.Playlists = append([]types.SimplePlaylistPageItem{formattedLikedPlaylist}, playlists.Playlists...)

		}

	}

	if err != nil {
		// just log, still return playlists
		log.Println("error fetching spotify user playlists:", err)
		return c.JSON(500, errorResponse("server error"))
	}

	return c.JSON(200, playlists)

}
