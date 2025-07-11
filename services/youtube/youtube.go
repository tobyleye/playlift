package youtube_service

import (
	"fmt"
	"strings"

	"github.com/tobyleye/playlift/types"
	"google.golang.org/api/youtube/v3"
)

var SNIPPET = []string{"snippet", "contentDetails"}

/*
lil wayne: i hate to see her go but i love to see her leave.
*/

// Helper function to extract artist names
func extractArtists(title string) []string {
	// In YouTube Music, artists are often part of the title, e.g., "Song Title - Artist"
	// We'll use a simple rule here to split the title and assume the artist is after the last hyphen.
	artists := []string{}
	parts := strings.Split(title, " - ")
	if len(parts) > 1 {
		artists = append(artists, parts[0])
	} else {
		artists = append(artists, "Unknown Artist")

	}
	return artists
}

func getPlaylistItems(youtubeService *youtube.Service, playlistId string) (types.SimpleTracks, error) {

	call := youtubeService.PlaylistItems.List([]string{"snippet", "contentDetails"}).PlaylistId(playlistId).MaxResults(50)
	response, err := call.Do()
	if err != nil {
		return types.SimpleTracks{}, err
	}

	playlistItems := types.SimpleTracks{
		Tracks: []types.SimpleTrack{},
		Total:  int(response.PageInfo.TotalResults),
	}
	// var playlistItems []types.SimpleTrack

	for _, item := range response.Items {

		snippet := item.Snippet
		videoTitle := snippet.Title
		videoID := snippet.ResourceId.VideoId
		link := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID)

		// Extract artists from the title or description
		artists := extractArtists(snippet.VideoOwnerChannelTitle)
		// Extract genre from description (or other metadata)
		// genre := "" // extractGenre(snippet.Description)

		playlistItems.Tracks = append(playlistItems.Tracks, types.SimpleTrack{
			Name:    videoTitle,
			Artists: artists,
			Link:    link,
			ID:      item.Id,
		})
	}

	return playlistItems, nil
}

func getPlaylistDetails(youtubeService *youtube.Service, playlistID string) (types.SimplePlaylist, error) {

	call := youtubeService.Playlists.List(SNIPPET).Id(playlistID).MaxResults(1)
	response, err := call.Do()

	if err != nil {
		return types.SimplePlaylist{}, err
	}

	playlistInfo := response.Items[0]

	playlistItems, _ := getPlaylistItems(youtubeService, playlistID)

	thumbnail := "" // playlistInfo.Snippet.Thumbnails.Default.Url

	return types.SimplePlaylist{
		Name:      playlistInfo.Snippet.Title,
		Thumbnail: thumbnail,
		Tracks:    playlistItems,
	}, nil
}

func getTrackDetails(youtubeService *youtube.Service, videoID string) (types.SimpleTrack, error) {
	// Fetch video details for a single track

	call := youtubeService.Videos.List([]string{"snippet"}).Id(videoID)
	response, err := call.Do()
	if err != nil {
		return types.SimpleTrack{}, err
	}

	// There should only be one item in the response for a single video
	if len(response.Items) == 0 {
		return types.SimpleTrack{}, fmt.Errorf("no video found for ID: %s", videoID)
	}

	// Extract details from the snippet

	snippet := response.Items[0].Snippet
	title := snippet.Title
	link := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID)
	channelTitle := snippet.ChannelTitle
	// Extract artist and genre using helper functions
	artists := extractArtists(channelTitle)

	// Return the formatted track details
	return types.SimpleTrack{
		ID:      videoID,
		Name:    title,
		Artists: artists,
		Link:    link,
		Snippet: snippet,
	}, nil
}

func SearchYoutube(youtubeService *youtube.Service, query string) (types.SimpleTrack, error) {

	res, err := youtubeService.Search.List([]string{"snippet"}).Q(query).Do()

	if err != nil {
		return types.SimpleTrack{}, err
	}
	// jsonString, err := json.Marshal(res)

	// queryResultFileName := fmt.Sprintf("search__%s.json", strings.ReplaceAll(query, " ", "_"))
	// f, err := os.Create(queryResultFileName)
	// if err != nil {
	// 	encoder := json.NewEncoder(f)
	// 	err := encoder.Encode(res)
	// 	if err != nil {
	// 		fmt.Println("error writing search result json", err)
	// 	}
	// }
	// os.WriteFile(queryResultFileName, jsonString, 0644)
	// fmt.Printf("search result ---- %v\n", res)

	bestMatch := res.Items[0]

	videoId := bestMatch.Id.VideoId

	return types.SimpleTrack{
		ID:      videoId,
		Name:    res.Items[0].Snippet.Title,
		Artists: extractArtists(res.Items[0].Snippet.Title),
		Link:    fmt.Sprintf("https://www.music.youtube.com/watch?v=%s", videoId),
	}, nil

}

// Todo: implement isPreview functionality
func GetYoutubeMusicInfo(youtubeService *youtube.Service, resourceId string, resourceType string) (interface{}, error) {
	if resourceType == "playlist" {
		playlist, err := getPlaylistDetails(youtubeService, resourceId)
		return playlist, err
	} else {
		track, err := getTrackDetails(youtubeService, resourceId)
		return track, err
	}
}
