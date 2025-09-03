package old_api

// Todo: implement formatters

import (
	"context"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/carlmjohnson/requests"
	"github.com/tobyleye/playlift/core/ytmusicapi"
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
const AND_SEPARATOR = "&"
const COMMA = ","
const DOT_SEPARATOR = "•"

var TRACK_TITLE_WITH_FEAT_REGEX = regexp.MustCompile(`(.*?) \(feat. (.*?)\)`)

var headers = map[string]string{
	// "user-agent":   USER_AGENT,
	"accept":       "*/*",
	"content-type": "application/json",
	"origin":       YTM_DOMAIN,
}

var defaultBody = map[string]interface{}{
	"context": map[string]interface{}{
		"client": map[string]interface{}{
			"clientName":    "IOS_MUSIC",
			"clientVersion": "6.42",
		},
	},
	"user": map[string]interface{}{},
}

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

func getArtists(artistsRow interface{}) []string {
	var artists = []string{}
	// the artist row contains not just the artist names, but the
	// album title as well and duration. they are each seperated by the dot
	// so to read the artist we read the first set of text before the first dot
	artistsRuns, _ := artistsRow.([]interface{})
	for _, artistRun := range artistsRuns {
		text := ytmusicapi.ReadValueString(artistRun, []interface{}{"text"})
		text = strings.TrimSpace(text)
		if text == DOT_SEPARATOR {
			break
		}

		if text != "" && text != AND_SEPARATOR && text != COMMA {
			artists = append(artists, text)
		}
	}
	return artists
}

func parseTrack(result interface{}) Track {
	result = ytmusicapi.ReadValue(result, []interface{}{"musicResponsiveListItemRenderer"})
	flexColumns := ytmusicapi.ReadValue(result, []interface{}{"flexColumns"})

	title := ytmusicapi.ReadValueString(flexColumns, []interface{}{0, "musicResponsiveListItemFlexColumnRenderer", "text", "runs", 0, "text"})
	artists := getArtists(
		ytmusicapi.ReadValue(flexColumns, []interface{}{1, "musicResponsiveListItemFlexColumnRenderer", "text", "runs"}),
	)

	// check if title has featured artist
	titleWithFeaturedArtists := TRACK_TITLE_WITH_FEAT_REGEX.FindStringSubmatch(title)

	if len(titleWithFeaturedArtists) > 2 {
		title = titleWithFeaturedArtists[1]
		artist := titleWithFeaturedArtists[2]
		artists = append(artists,
			strings.Split(artist,
				fmt.Sprintf(" %s ", AND_SEPARATOR),
			)...)
	}

	videoId := ytmusicapi.ReadValueString(result, []interface{}{
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

	ytmusicapi.SaveJson(data, fmt.Sprintf("ytmusic-search-%s.json", searchQuery.Title)) // for debugging

	sectionListContent := ytmusicapi.ReadValue(data, []interface{}{"contents", "tabbedSearchResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents"})

	sectionListContentArray, _ := sectionListContent.([]interface{})

	//  0, "musicShelfRenderer", "contents"

	musicShelfIndex := 0
	//  in cases where the search query is misspelt an additional section that
	// contains spelling suggestions is also returned, pushing the musicShelfRenderer to the end of the array

	if len(sectionListContentArray) > 1 {
		musicShelfIndex = len(sectionListContentArray) - 1
	}

	musicShelfContent := ytmusicapi.ReadValue(sectionListContentArray[musicShelfIndex], []interface{}{"musicShelfRenderer", "contents"})

	var results []Track

	if content, ok := musicShelfContent.([]interface{}); ok {
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

	playlistItemsContents := ytmusicapi.ReadValue(jsonResponse, []interface{}{"contents", "twoColumnBrowseResultsRenderer", "secondaryContents", "sectionListRenderer", "contents", 0, "musicPlaylistShelfRenderer", "contents"})
	playlistHeader := ytmusicapi.ReadValue(jsonResponse, []interface{}{"contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents",
		0, "musicEditablePlaylistDetailHeaderRenderer",
		"header", "musicResponsiveHeaderRenderer",
	})

	// saved playlists that not for the user, has a different structure

	if _, ok := playlistHeader.(map[string]interface{}); !ok {
		playlistHeader = ytmusicapi.ReadValue(jsonResponse, []interface{}{"contents", "twoColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents",
			0, "musicResponsiveHeaderRenderer",
		})

	}

	title := ytmusicapi.ReadValueString(playlistHeader, []interface{}{"title", "runs", 0, "text"})
	totalTracks := ytmusicapi.ReadValueString(playlistHeader, []interface{}{"secondSubtitle", "runs", 0, "text"})

	// sometimes the total tracks is suffixed with 'tracks' sometimes it's songs
	// thats why we handle both cases
	// a better solution might be to use regex to extract the number.
	// Todo:

	totalTracks = strings.Replace(totalTracks, " tracks", "", 1)
	totalTracks = strings.Replace(totalTracks, " songs", "", 1)

	totalTracks = strings.ReplaceAll(totalTracks, ",", "")

	totalTracksInt, _ := strconv.Atoi(totalTracks)

	description := ytmusicapi.ReadValueString(playlistHeader, []interface{}{"description", "musicDescriptionShelfRenderer", "description", "runs", 0, "text"})

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

		continuationItems := ytmusicapi.ReadValue(jsonResponse, []interface{}{
			"onResponseReceivedActions",
			0,
			"appendContinuationItemsAction",
			"continuationItems"})

		if items, ok := continuationItems.([]interface{}); ok {
			for index, itemContent := range items {
				item := parseTrack(itemContent)

				if index == len(items)-1 && item.VideoId == "" {
					// it's possible that the last item is a continuation item
					nextContinuation = ytmusicapi.ReadValueString(itemContent, []interface{}{"continuationItemRenderer", "continuationEndpoint", "continuationCommand", "token"})
				} else {
					playlistTracks = append(playlistTracks, item)
				}
			}
		} else {
			fmt.Println("no continuation items found")
		}
	} else {

		playlistItemsContents := ytmusicapi.ReadValue(jsonResponse, []interface{}{"contents", "twoColumnBrowseResultsRenderer", "secondaryContents", "sectionListRenderer", "contents", 0, "musicPlaylistShelfRenderer", "contents"})

		if content, ok := playlistItemsContents.([]interface{}); ok {
			for index, itemContent := range content {
				item := parseTrack(itemContent)
				// it's possible that the last item is a continuation item

				if index == len(content)-1 && item.VideoId == "" {
					nextContinuation = ytmusicapi.ReadValueString(itemContent, []interface{}{"continuationItemRenderer", "continuationEndpoint", "continuationCommand", "token"})
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
	totalTracksText := ytmusicapi.ReadValueString(lastTextRun, []interface{}{"text"})
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

	ytmusicapi.SaveJson(jsonResponse, "user-playlists")

	var playlistItemsContents interface{}
	var nextContinuation string

	if continuation == "" {
		// itemsKey := []interface{}{"contents", "singleColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "gridRenderer", "items"}
		itemsKey := []interface{}{"contents", "singleColumnBrowseResultsRenderer", "tabs", 0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "musicShelfRenderer", "contents"}
		playlistItemsContents = ytmusicapi.ReadValue(jsonResponse, itemsKey)
		nextContinuation = ytmusicapi.ReadValueString(jsonResponse, []interface{}{
			"contents", "singleColumnBrowseResultsRenderer", "tabs",
			0, "tabRenderer", "content", "sectionListRenderer", "contents", 0, "gridRenderer",
			"continuations", 0, "nextContinuationData", "continuation",
		})

	} else {
		itemsKey := []interface{}{"continuationContents", "gridContinuation", "items"}
		playlistItemsContents = ytmusicapi.ReadValue(jsonResponse, itemsKey)
		nextContinuation = ytmusicapi.ReadValueString(jsonResponse, []interface{}{
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
				// itemRow := ytmusicapi.ReadValue(item, []interface{}{"musicTwoRowItemRenderer"})
				itemRow := ytmusicapi.ReadValue(item, []interface{}{"musicTwoColumnItemRenderer"})
				title := ytmusicapi.ReadValueString(itemRow, []interface{}{"title", "runs", 0, "text"})

				thumbnails, _ := ytmusicapi.ReadValue(itemRow, []interface{}{"thumbnailRenderer", "musicThumbnailRenderer", "thumbnail", "thumbnails"}).([]interface{})

				thumbnailUrls := []string{}

				subtitleRuns, _ := ytmusicapi.ReadValue(itemRow, []interface{}{"subtitle", "runs"}).([]interface{})

				for _, thumbnail := range thumbnails {
					thumnailMap, _ := thumbnail.(map[string]interface{})
					url, _ := thumnailMap["url"].(string)
					if url != "" {
						thumbnailUrls = append(thumbnailUrls, url)
					}

				}

				totalTracks := getPlaylistTotalTracks(subtitleRuns)

				playlistId := ytmusicapi.ReadValueString(itemRow, []interface{}{"title", "runs", 0, "navigationEndpoint", "browseEndpoint", "browseId"})

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

	playlistId := ytmusicapi.ReadValueString(data, []interface{}{
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
	contents := ytmusicapi.ReadValue(jsonResponse, []interface{}{
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
			itemRenderer := ytmusicapi.ReadValue(item, []interface{}{"musicTwoRowItemRenderer"})
			if itemRenderer == nil {
				continue
			}

			// Extract title
			title := ytmusicapi.ReadValueString(itemRenderer, []interface{}{"title", "runs", 0, "text"})

			// Extract playlist ID from browseId
			browseId := ytmusicapi.ReadValueString(itemRenderer, []interface{}{
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
			thumbnails := ytmusicapi.ReadValue(itemRenderer, []interface{}{
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
			subtitleRuns := ytmusicapi.ReadValue(itemRenderer, []interface{}{"subtitle", "runs"})
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
