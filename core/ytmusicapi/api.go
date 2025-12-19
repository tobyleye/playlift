package ytmusicapi

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/carlmjohnson/requests"
	"github.com/tobyleye/playlift/core/ytmusicapi/parsers"
	"github.com/tobyleye/playlift/types"
)

// Re-export types from parsers package for backward compatibility
type Track = parsers.Track
type YoutubePlaylist = parsers.YoutubePlaylist
type PlaylistDetails = parsers.PlaylistDetails
type PlaylistAllTracksResponse = parsers.PlaylistAllTracksResponse
type PlaylistTracksResponse = parsers.PlaylistTracksResponse
type CreatedPlaylist = parsers.CreatedPlaylist
type PlaylistPageResponse = parsers.PlaylistPageResponse

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0"
const YTM_DOMAIN = "https://music.youtube.com"

// Helper functions

func getPlaylistTotalTracks(subtitleRuns []interface{}) string {
	lastTextRun := subtitleRuns[len(subtitleRuns)-1]
	totalTracksText := ReadValueString(lastTextRun, []interface{}{"text"})
	totalTracks := strings.Split(totalTracksText, " ")[0]
	return totalTracks
}

var headers = map[string]string{
	// "user-agent":   USER_AGENT,
	"accept":       "*/*",
	"content-type": "application/json",
	"origin":       YTM_DOMAIN,
}

type WebClient struct {
	name    string
	version string
	parser  parsers.Parser
}

var HTML5Client = &WebClient{
	name:    "TVHTML5",
	version: "7.20240925.00.00",
	parser:  parsers.NewTVHTML5Parser(),
}

var HTML5EmbeddedClient = &WebClient{
	name:    "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
	version: "2.0",
	parser:  nil,
}

var WebRemix = &WebClient{
	name:    "WEB_REMIX",
	version: "1.20250910.01.00",
	parser:  parsers.NewWebRemixParser(),
}

func getSearchParams(filter, scope string, ignoreSpelling bool) string {
	filteredParam1 := "EgWKAQ"
	var params string
	var param1, param2, param3 string

	if filter == "" && scope == "" && !ignoreSpelling {
		return params
	}

	if scope == "uploads" {
		params = "agIYAw%3D%3D"
	}

	if scope == "library" {
		if filter != "" {
			param1 = filteredParam1
			param2 = getParam2(filter)
			param3 = "AWoKEAUQCRADEAoYBA%3D%3D"
		} else {
			params = "agIYBA%3D%3D"
		}
	}

	if scope == "" && filter != "" {
		if filter == "playlists" {
			params = "Eg-KAQwIABAAGAAgACgB"
			if !ignoreSpelling {
				params += "MABqChAEEAMQCRAFEAo%3D"
			} else {
				params += "MABCAggBagoQBBADEAkQBRAK"
			}

		} else if filter == "featured_playlists" || filter == "community_playlists" {
			param1 = "EgeKAQQoA"
			if filter == "featured_playlists" {
				param2 = "Dg"
			} else { // community_playlists
				param2 = "EA"
			}

			if !ignoreSpelling {
				param3 = "BagwQDhAKEAMQBBAJEAU%3D"
			} else {
				param3 = "BQgIIAWoMEA4QChADEAQQCRAF"
			}

		} else {
			param1 = filteredParam1
			param2 = getParam2(filter)
			if !ignoreSpelling {
				param3 = "AWoMEA4QChADEAQQCRAF"
			} else {
				param3 = "AUICCAFqDBAOEAoQAxAEEAkQBQ%3D%3D"
			}
		}
	}

	if scope == "" && filter == "" && ignoreSpelling {
		params = "EhGKAQ4IARABGAEgASgAOAFAAUICCAE%3D"
	}

	if params != "" {
		return params
	}

	return param1 + param2 + param3
}

// Helper function for param2
func getParam2(filter string) string {
	filterParams := map[string]string{
		"songs":     "II",
		"videos":    "IQ",
		"albums":    "IY",
		"artists":   "Ig",
		"playlists": "Io",
		"profiles":  "JY",
		"podcasts":  "JQ",
		"episodes":  "JI",
	}

	return filterParams[filter]
}

func sendRequest(httpClient *http.Client, webClient *WebClient, endpoint string, body map[string]interface{}) (interface{}, error) {
	url := fmt.Sprintf("https://music.youtube.com/youtubei/v1/%s?alt=json", endpoint)

	var defaultBody = map[string]interface{}{
		"context": map[string]interface{}{
			"client": map[string]interface{}{
				// "clientName":    "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
				// "clientVersion": "2.0",
				// "clientName":    "IOS_MUSIC",
				// "clientVersion": "6.42",
				// "clientName":    "WEB_REMIX",
				// "clientVersion": "1.20250910.01.00",
				// "clientName":    "TVHTML5",
				// "clientVersion": "7.20240925.00.00",
				// "clientName":    "WEB_REMIX",
				// "clientVersion": fmt.Sprintf("1.%s.01.00", time.Now().UTC().Format("20060102")),
				"clientName":    webClient.name,
				"clientVersion": webClient.version,
			},
			"user": map[string]interface{}{},
		},
	}

	for key, value := range defaultBody {
		body[key] = value
	}

	var jsonResponse interface{}

	ctx := context.Background()

	// var buf = new(bytes.Buffer)

	builder := requests.
		URL(url).Client(httpClient)

	// set headers
	for key, val := range headers {
		builder.Header(key, val)
	}

	var errorJson interface{}

	err := builder.BodyJSON(&body).
		ToJSON(&jsonResponse).ErrorJSON(&errorJson).
		Fetch(ctx)

	fmt.Printf("%v", errorJson)

	return jsonResponse, err

}

func Search(client *http.Client, searchQuery types.SearchQuery) ([]Track, error) {
	filter := "songs"
	scope := ""
	ignoreSpelling := true

	query := searchQuery.Title + " by " + strings.Join(searchQuery.Artists, ", ")

	params := getSearchParams(filter, scope, ignoreSpelling)
	body := map[string]interface{}{"query": query}
	if params != "" {
		body["params"] = params

	}

	data, err := sendRequest(client, HTML5Client, "search", body)
	if err != nil {
		return nil, err
	}

	SaveJson(data, fmt.Sprintf("ytmusic-search-%s.json", searchQuery.Title)) // for debugging

	return HTML5Client.parser.ParseSearchResults(data), nil
}

func SearchOne(client *http.Client, searchQuery types.SearchQuery) (Track, error) {
	results, err := Search(client, searchQuery)
	if err != nil {
		return Track{}, err
	}

	if len(results) == 0 {
		return Track{}, nil
	}

	return results[0], nil
}

func FetchPlaylist(client *http.Client, playlistId string) (PlaylistDetails, error) {
	browseId := playlistId

	if !strings.HasPrefix(browseId, "VL") {
		browseId = "VL" + browseId
	}

	body := map[string]interface{}{
		"browseId": browseId,
	}
	jsonResponse, err := sendRequest(client, HTML5Client, "browse", body)
	if err != nil {
		return PlaylistDetails{}, err
	}

	SaveJson(jsonResponse, "playlist_fetch_new")

	playlistDetails := HTML5Client.parser.ParsePlaylistDetails(jsonResponse)
	playlistDetails.Link = fmt.Sprintf("https://music.youtube.com/playlist?list=%s", playlistId)

	return playlistDetails, nil
}

func FetchPlaylistTracks(client *http.Client, playlistId string, continuation string) (PlaylistTracksResponse, error) {
	browseId := playlistId

	if !strings.HasPrefix(browseId, "VL") {
		browseId = "VL" + browseId
	}

	// prepare request body
	body := map[string]interface{}{}

	if continuation != "" {
		body["continuation"] = continuation
	} else {
		body["browseId"] = browseId
	}

	jsonResponse, err := sendRequest(client, HTML5Client, "browse", body)

	// if continuation != "" {
	// 	SaveJson(jsonResponse, "playlist-tracks-page-2")
	// } else {
	// 	SaveJson(jsonResponse, "playlist-tracks")
	// }

	if err != nil {
		return PlaylistTracksResponse{}, err
	}

	playlistTracks, nextContinuation := HTML5Client.parser.ParsePlaylistTracks(jsonResponse, continuation == "")

	return PlaylistTracksResponse{
		NextContinuation: nextContinuation,
		Tracks:           playlistTracks,
	}, nil
}

func FetchAllPlaylistTracks(client *http.Client, playlistId string) (PlaylistAllTracksResponse, error) {

	tracks := []Track{}

	nextContinuation := ""
	// fetch next Page
	for {
		nextTracks, err := FetchPlaylistTracks(client, playlistId, nextContinuation)
		if err != nil {
			return PlaylistAllTracksResponse{}, err
		}

		tracks = append(tracks, nextTracks.Tracks...)

		nextContinuation = nextTracks.NextContinuation
		if nextContinuation == "" {
			break // no more tracks to fetch
		}
	}

	// SaveJson(tracks, "all-tracks")
	return PlaylistAllTracksResponse{
		Total:  len(tracks),
		Tracks: tracks,
	}, nil
}

func FetchUserPlaylists(httpClient *http.Client, continuation string) (PlaylistPageResponse, error) {
	var body map[string]interface{}

	if continuation == "" {
		body = map[string]interface{}{"browseId": "FEmusic_liked_playlists"}
	} else {
		body = map[string]interface{}{"continuation": continuation}
	}

	jsonResponse, err := sendRequest(httpClient, HTML5Client, "browse", body)

	if err != nil {
		return PlaylistPageResponse{}, err
	}

	SaveJson(jsonResponse, "user-playlists-response")

	// var filename string

	// if continuation != "" {
	// 	filename = "user-playlists-page-2"
	// } else {
	// 	filename = "user-playlists"
	// }

	// SaveJson(jsonResponse, filename)

	youtubePlaylists, nextContinuation := HTML5Client.parser.ParseUserPlaylists(jsonResponse, continuation == "")

	SaveJson(youtubePlaylists, "user-playlists-response-parsed")

	return PlaylistPageResponse{
		Continuation: nextContinuation,
		Playlists:    youtubePlaylists,
	}, nil
}

func CreatePlaylist(client *http.Client, title string, description string, videoIds []string) (CreatedPlaylist, error) {
	// privacy_status: Playlists can be ``PUBLIC``, ``PRIVATE``, or ``UNLISTED``. Default: ``PRIVATE``
	privacyStatus := "PRIVATE"

	endpoint := "playlist/create"
	body := map[string]interface{}{
		"title":         title,
		"description":   description,
		"privacyStatus": privacyStatus,
		"videoIds":      videoIds,
	}
	data, err := sendRequest(client, HTML5EmbeddedClient, endpoint, body)

	if err != nil {
		return CreatedPlaylist{}, err
	}

	SaveJson(data, "create-playlist-response")

	playlistId := ReadValueString(data, []interface{}{
		"playlistId",
	})

	return CreatedPlaylist{
		PlaylistId:  playlistId,
		Link:        parsers.CreatePlaylistLink(playlistId),
		Title:       title,
		Description: description,
	}, nil
}

func FetchLikedPlaylist(client *http.Client) (YoutubePlaylist, error) {
	// Fetch the liked playlists
	playlistId := "LM" // Liked music playlist ID is always "LM"
	playlistDetails, err := FetchPlaylist(client, playlistId)
	if err != nil {
		return YoutubePlaylist{}, err

	}

	playlist := YoutubePlaylist{
		Title:       playlistDetails.Title,
		Thumbnails:  playlistDetails.Thumbnails,
		TotalTracks: fmt.Sprintf("%d", playlistDetails.TotalTracks),
		PlaylistId:  playlistId,
		Url:         fmt.Sprintf("https://music.youtube.com/playlist?list=%s", playlistId),
	}
	return playlist, err
}
