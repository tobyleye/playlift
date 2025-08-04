package ytmusicapi

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/carlmjohnson/requests"
	"github.com/tobyleye/playlift/types"
)

type Track struct {
	VideoId string
	Title   string
	Artists []string
	Link    string
}

type YoutubePlaylist struct {
	Title       string   `json:"title"`
	Thumbnails  []string `json:"thumbnails"`
	TotalTracks string   `json:"total_tracks"`
	PlaylistId  string   `json:"playlist_id"`
	Url         string   `json:"url"`
}

type PlaylistDetails struct {
	Title          string
	Description    string
	TotalTracks    int
	PlaylistTracks []Track
	Link           string
	Thumbnails     []string
}

type PlaylistAllTracksResponse struct {
	Total  int     `json:"total"`
	Tracks []Track `json:"tracks"`
}

type PlaylistTracksResponse struct {
	NextContinuation string  `json:"next_continuation"`
	Tracks           []Track `json:"tracks"`
}

type CreatedPlaylist struct {
	PlaylistId  string `json:"playlist_id"`
	Link        string `json:"link"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type PlaylistPageResponse struct {
	Continuation string            `json:"continuation"`
	Playlists    []YoutubePlaylist `json:"playlists"`
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0"
const YTM_DOMAIN = "https://music.youtube.com"

var headers = map[string]string{
	"user-agent":   USER_AGENT,
	"accept":       "*/*",
	"content-type": "application/json",
	"origin":       YTM_DOMAIN,
}

var defaultBody = map[string]interface{}{
	"context": map[string]interface{}{
		"client": map[string]interface{}{
			"clientName":    "WEB_REMIX",
			"clientVersion": fmt.Sprintf("1.%s.01.00", time.Now().UTC().Format("20060102")),
		},
		"user": map[string]interface{}{},
	},
}

var SEPERATOR = " • "

func createPlaylistLink(playlistId string) string {
	return fmt.Sprintf("https://music.youtube.com/playlist?list=%s", playlistId)
}

func createTrackLink(trackId string) string {
	return fmt.Sprintf("https://music.youtube.com/watch?v=%s", trackId)
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

func getArtists(artistsFlexRendererRuns []interface{}) []string {
	var artists = []string{}
	for _, artistRun := range artistsFlexRendererRuns {
		artist := ReadValueString(artistRun, []interface{}{"text"})
		if artist != "" {
			artists = append(artists, artist)
		}
	}
	return artists
}

func parseTrack(result interface{}) Track {
	result = ReadValue(result, []interface{}{"musicResponsiveListItemRenderer"})
	flexColumns := ReadValue(result, []interface{}{"flexColumns"})

	var title string = ""
	// var artist string = ""
	var artists []string

	flexColumnsSlice, ok := flexColumns.([]interface{})
	if ok {
		title = ReadValueString(flexColumnsSlice[0], []interface{}{"musicResponsiveListItemFlexColumnRenderer", "text", "runs", 0, "text"})
		artists = getArtists(ReadValue(flexColumnsSlice[1], []interface{}{"musicResponsiveListItemFlexColumnRenderer", "text", "runs"}).([]interface{}))
		// artist = ReadValueString(flexColumnsSlice[1], []interface{}{"musicResponsiveListItemFlexColumnRenderer", "text", "runs", 0, "text"})
	}

	videoId := ReadValueString(result, []interface{}{
		"overlay",
		"musicItemThumbnailOverlayRenderer",
		"content",
		"musicPlayButtonRenderer",
		"playNavigationEndpoint",
		"watchEndpoint",
		"videoId"})

	return Track{
		VideoId: videoId,
		Title:   title,
		Artists: artists,
		Link:    createTrackLink(videoId),
	}
}

func sendRequest(httpClient *http.Client, endpoint string, body map[string]interface{}) (interface{}, error) {
	url := fmt.Sprintf("https://music.youtube.com/youtubei/v1/%s?alt=json", endpoint)

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

	err := builder.BodyJSON(&body).
		ToJSON(&jsonResponse).
		Fetch(ctx)

	if err != nil {
		return nil, err
	}

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

	data, err := sendRequest(client, "search", body)
	if err != nil {
		return nil, err
	}

	content := ReadValue(data, []interface{}{"contents", "tabbedSearchResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "musicShelfRenderer", "contents"})

	var results []Track

	if content, ok := content.([]interface{}); ok {
		for _, item := range content {
			parsedResult := parseTrack(item)
			results = append(results, parsedResult)

		}
	}

	return results, nil
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
	jsonResponse, err := sendRequest(client, "browse", body)
	if err != nil {
		return PlaylistDetails{}, err
	}

	var playlistTracks []Track

	playlistItemsContents := ReadValue(jsonResponse, []interface{}{"contents", "twoColumnBrowseResultsRenderer", "secondaryContents", "sectionListRenderer", "contents", 0, "musicPlaylistShelfRenderer", "contents"})
	playlistHeader := ReadValue(jsonResponse, []interface{}{"contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents",
		0, "musicEditablePlaylistDetailHeaderRenderer",
		"header", "musicResponsiveHeaderRenderer",
	})

	// saved playlists that not for the user, has a different structure

	if _, ok := playlistHeader.(map[string]interface{}); !ok {
		playlistHeader = ReadValue(jsonResponse, []interface{}{"contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents",
			0, "musicResponsiveHeaderRenderer",
		})

	}

	title := ReadValueString(playlistHeader, []interface{}{"title", "runs", 0, "text"})
	totalTracks := ReadValueString(playlistHeader, []interface{}{"secondSubtitle", "runs", 0, "text"})

	// sometimes the total tracks is suffixed with 'tracks' sometimes it's songs
	// thats why we handle both cases
	// a better solution might be to use regex to extract the number.
	// Todo:

	totalTracks = strings.Replace(totalTracks, " tracks", "", 1)
	totalTracks = strings.Replace(totalTracks, " songs", "", 1)

	totalTracks = strings.ReplaceAll(totalTracks, ",", "")

	totalTracksInt, _ := strconv.Atoi(totalTracks)

	description := ReadValueString(playlistHeader, []interface{}{"description", "musicDescriptionShelfRenderer", "description", "runs", 0, "text"})

	if content, ok := playlistItemsContents.([]interface{}); ok {
		for _, itemContent := range content {
			item := parseTrack(itemContent)
			playlistTracks = append(playlistTracks, item)
		}
	}

	playlist := PlaylistDetails{
		Title:          title,
		Description:    description,
		TotalTracks:    totalTracksInt,
		PlaylistTracks: playlistTracks,
		Link:           createPlaylistLink(playlistId),
	}

	return playlist, nil
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

	jsonResponse, err := sendRequest(client, "browse", body)

	if err != nil {
		return PlaylistTracksResponse{}, err
	}

	var nextContinuation string
	var playlistTracks []Track

	// parse response
	// Todo: collapse the two for loop below into 1
	if continuation != "" {

		continuationItems := ReadValue(jsonResponse, []interface{}{
			"onResponseReceivedActions",
			0,
			"appendContinuationItemsAction",
			"continuationItems"})

		if items, ok := continuationItems.([]interface{}); ok {
			for index, itemContent := range items {
				item := parseTrack(itemContent)

				if index == len(items)-1 && item.VideoId == "" {
					// it's possible that the last item is a continuation item
					nextContinuation = ReadValueString(itemContent, []interface{}{"continuationItemRenderer", "continuationEndpoint", "continuationCommand", "token"})
				} else {
					playlistTracks = append(playlistTracks, item)
				}
			}
		} else {
			fmt.Println("no continuation items found")
		}
	} else {

		playlistItemsContents := ReadValue(jsonResponse, []interface{}{"contents", "twoColumnBrowseResultsRenderer", "secondaryContents", "sectionListRenderer", "contents", 0, "musicPlaylistShelfRenderer", "contents"})

		if content, ok := playlistItemsContents.([]interface{}); ok {
			for index, itemContent := range content {
				item := parseTrack(itemContent)
				// it's possible that the last item is a continuation item

				if index == len(content)-1 && item.VideoId == "" {
					nextContinuation = ReadValueString(itemContent, []interface{}{"continuationItemRenderer", "continuationEndpoint", "continuationCommand", "token"})
				} else {
					playlistTracks = append(playlistTracks, item)
				}
			}
		}
	}

	return PlaylistTracksResponse{
		NextContinuation: nextContinuation, // You can set this to the next continuation token if available
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
	return PlaylistAllTracksResponse{
		Total:  len(tracks),
		Tracks: tracks,
	}, nil

}

func getPlaylistTotalTracks(subtitleRuns []interface{}) string {
	lastTextRun := subtitleRuns[len(subtitleRuns)-1]
	totalTracksText := ReadValueString(lastTextRun, []interface{}{"text"})
	totalTracks := strings.Split(totalTracksText, " ")[0]
	return totalTracks
}

func FetchUserPlaylists(httpClient *http.Client, continuation string) (PlaylistPageResponse, error) {
	var body map[string]interface{}

	if continuation == "" {
		body = map[string]interface{}{"browseId": "FEmusic_liked_playlists"}
	} else {
		body = map[string]interface{}{"continuation": continuation}
	}

	jsonResponse, err := sendRequest(httpClient, "browse", body)

	if err != nil {
		return PlaylistPageResponse{}, err
	}

	var playlistItemsContents interface{}
	var nextContinuation string

	if continuation == "" {
		itemsKey := []interface{}{"contents", "singleColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "gridRenderer", "items"}
		playlistItemsContents = ReadValue(jsonResponse, itemsKey)
		nextContinuation = ReadValueString(jsonResponse, []interface{}{
			"contents", "singleColumnBrowseResultsRenderer", "tabs",
			0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "gridRenderer",
			"continuations", 0, "nextContinuationData", "continuation",
		})

	} else {
		itemsKey := []interface{}{"continuationContents", "gridContinuation", "items"}
		playlistItemsContents = ReadValue(jsonResponse, itemsKey)
		nextContinuation = ReadValueString(jsonResponse, []interface{}{
			"continuationContents", "gridContinuation", "continuations", 0, "nextContinuationData", "continuation",
		})
	}

	youtubePlaylists := []YoutubePlaylist{}

	if items, ok := playlistItemsContents.([]interface{}); ok {
		// first item is a  new playlist button
		// second item is liked music plalists
		// so we skip the first 2 items

		if len(items) > 2 {
			for _, item := range items[2:] {
				itemRow := ReadValue(item, []interface{}{"musicTwoRowItemRenderer"})
				title := ReadValueString(itemRow, []interface{}{"title", "runs", 0, "text"})

				thumbnails, _ := ReadValue(itemRow, []interface{}{"thumbnailRenderer", "musicThumbnailRenderer", "thumbnail", "thumbnails"}).([]interface{})

				thumbnailUrls := []string{}

				subtitleRuns, _ := ReadValue(itemRow, []interface{}{"subtitle", "runs"}).([]interface{})

				for _, thumbnail := range thumbnails {
					thumnailMap, _ := thumbnail.(map[string]interface{})
					url, _ := thumnailMap["url"].(string)
					if url != "" {
						thumbnailUrls = append(thumbnailUrls, url)
					}

				}

				totalTracks := getPlaylistTotalTracks(subtitleRuns)

				playlistId := ReadValueString(itemRow, []interface{}{"title", "runs", 0, "navigationEndpoint", "browseEndpoint", "browseId"})

				if len(playlistId) > 2 && playlistId[0:2] == "VL" {
					playlistId = playlistId[2:]
				}

				playlist := YoutubePlaylist{
					Title:       title,
					Thumbnails:  thumbnailUrls,
					TotalTracks: totalTracks,
					PlaylistId:  playlistId,
					Url:         createPlaylistLink(playlistId),
				}

				youtubePlaylists = append(youtubePlaylists, playlist)

			}
		}
	}

	response := PlaylistPageResponse{
		Continuation: nextContinuation,
		Playlists:    youtubePlaylists,
	}

	return response, nil
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
	data, err := sendRequest(client, endpoint, body)

	if err != nil {
		return CreatedPlaylist{}, err
	}

	playlistId := ReadValueString(data, []interface{}{
		"playlistId",
	})

	return CreatedPlaylist{
		PlaylistId:  playlistId,
		Link:        createPlaylistLink(playlistId),
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
		TotalTracks: strconv.Itoa(playlistDetails.TotalTracks),
		PlaylistId:  playlistId,
		Url:         createPlaylistLink(playlistId),
	}
	return playlist, err
}

// ExtractPlaylistsFromNextPage extracts playlist information from a next-page continuation response
func ExtractPlaylistsFromNextPage(jsonResponse interface{}) []YoutubePlaylist {
	var playlists []YoutubePlaylist

	// Navigate to the contents array in the continuation response
	contents := ReadValue(jsonResponse, []interface{}{
		"continuationContents",
		"sectionListContinuation",
		"contents",
		0,
		"musicCarouselShelfRenderer",
		"contents",
	})

	if contentsList, ok := contents.([]interface{}); ok {
		for _, item := range contentsList {
			// Extract musicTwoRowItemRenderer
			itemRenderer := ReadValue(item, []interface{}{"musicTwoRowItemRenderer"})
			if itemRenderer == nil {
				continue
			}

			// Extract title
			title := ReadValueString(itemRenderer, []interface{}{"title", "runs", 0, "text"})

			// Extract playlist ID from browseId
			browseId := ReadValueString(itemRenderer, []interface{}{
				"navigationEndpoint",
				"browseEndpoint",
				"browseId",
			})

			// Remove "VL" prefix if present
			playlistId := browseId
			if len(playlistId) > 2 && playlistId[0:2] == "VL" {
				playlistId = playlistId[2:]
			}

			// Extract thumbnails
			thumbnails := ReadValue(itemRenderer, []interface{}{
				"thumbnailRenderer",
				"musicThumbnailRenderer",
				"thumbnail",
				"thumbnails",
			})

			var thumbnailUrls []string
			if thumbsList, ok := thumbnails.([]interface{}); ok {
				for _, thumb := range thumbsList {
					if thumbMap, ok := thumb.(map[string]interface{}); ok {
						if url, ok := thumbMap["url"].(string); ok && url != "" {
							thumbnailUrls = append(thumbnailUrls, url)
						}
					}
				}
			}

			// Extract subtitle runs to get total tracks
			subtitleRuns := ReadValue(itemRenderer, []interface{}{"subtitle", "runs"})
			totalTracks := ""
			if runs, ok := subtitleRuns.([]interface{}); ok {
				totalTracks = getPlaylistTotalTracks(runs)
			}

			// Create playlist object
			playlist := YoutubePlaylist{
				Title:       title,
				Thumbnails:  thumbnailUrls,
				TotalTracks: totalTracks,
				PlaylistId:  playlistId,
				Url:         createPlaylistLink(playlistId),
			}

			playlists = append(playlists, playlist)
		}
	}

	return playlists
}
