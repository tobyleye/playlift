package parsers

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var tvhtml5TrackTitleWithFeatRegex = regexp.MustCompile(`(.*?) \(feat. (.*?)\)`)

// TVHTML5Parser implements parsing logic for the TVHTML5_SIMPLY_EMBEDDED_PLAYER YouTube Music client
type TVHTML5Parser struct{}

// creates a parser for TVHTML5 client responses
func NewTVHTML5Parser() Parser {
	return &TVHTML5Parser{}
}

// ParseSearchResults extracts tracks from a search response
func (p *TVHTML5Parser) ParseSearchResults(data interface{}) []Track {
	tracks := []Track{}

	// Navigate to the shelf renderer contents
	sections := ReadValue(data, []interface{}{
		"contents", "sectionListRenderer", "contents",
	})

	if sectionsList, ok := sections.([]interface{}); ok {
		for _, section := range sectionsList {
			// Get the horizontal list items from shelf renderer
			items := ReadValue(section, []interface{}{
				"shelfRenderer", "content", "horizontalListRenderer", "items",
			})

			if itemsList, ok := items.([]interface{}); ok {
				for _, item := range itemsList {
					track := parseTrackItem(item)
					if track.VideoId != "" {
						tracks = append(tracks, track)
					}
				}
			}
		}
	}

	return tracks
}

// ParsePlaylistDetails extracts playlist metadata and tracks from a playlist fetch response
func (p *TVHTML5Parser) ParsePlaylistDetails(jsonResponse interface{}) PlaylistDetails {
	// Navigate to the entity metadata for playlist info
	metadata := ReadValue(jsonResponse, []interface{}{
		"contents", "tvBrowseRenderer", "content", "tvSurfaceContentRenderer",
		"content", "twoColumnRenderer", "leftColumn", "entityMetadataRenderer",
	})

	// Extract title
	title := ReadValueString(metadata, []interface{}{"title", "simpleText"})

	// Extract description (if present)
	description := ReadValueString(metadata, []interface{}{"description", "simpleText"})

	// Extract bylines to get track count
	// The bylines structure has items like: [badge, owner, "•", "141 videos", "•", "No views"]
	bylineItems := ReadValue(metadata, []interface{}{"bylines", 0, "lineRenderer", "items"})

	totalTracks := 0
	if items, ok := bylineItems.([]interface{}); ok {
		for _, item := range items {
			// Look for the item with video count
			runs := ReadValue(item, []interface{}{"lineItemRenderer", "text", "runs"})
			if runsArray, ok := runs.([]interface{}); ok && len(runsArray) > 0 {
				// First run should have the number
				count := ReadValueString(runsArray[0], []interface{}{"text"})
				if count != "" {
					// Check if next run contains "videos" or "songs"
					if len(runsArray) > 1 {
						suffix := ReadValueString(runsArray[1], []interface{}{"text"})
						if strings.Contains(suffix, "video") || strings.Contains(suffix, "song") {
							totalTracks = cleanTrackCount(count)
							break
						}
					}
				}
			}
		}
	}

	// Extract thumbnails from the first track
	thumbnails := []string{}
	firstTrack := ReadValue(jsonResponse, []interface{}{
		"contents", "tvBrowseRenderer", "content", "tvSurfaceContentRenderer",
		"content", "twoColumnRenderer", "rightColumn", "playlistVideoListRenderer",
		"contents", 0, "tileRenderer", "header", "tileHeaderRenderer", "thumbnail", "thumbnails",
	})

	if thumbsList, ok := firstTrack.([]interface{}); ok && len(thumbsList) > 0 {
		for _, thumb := range thumbsList {
			if thumbMap, ok := thumb.(map[string]interface{}); ok {
				if url, ok := thumbMap["url"].(string); ok && url != "" {
					thumbnails = append(thumbnails, url)
				}
			}
		}
	}

	// Get the first page of tracks
	tracks, _ := p.ParsePlaylistTracks(jsonResponse, true)

	return PlaylistDetails{
		Title:          title,
		Description:    description,
		TotalTracks:    totalTracks,
		PlaylistTracks: tracks,
		Link:           "",
		Thumbnails:     thumbnails,
	}
}

// parseTrackItem extracts track information from a tileRenderer
// Works for both playlist tracks and search results
func parseTrackItem(item interface{}) Track {
	tileRenderer := ReadValue(item, []interface{}{"tileRenderer"})
	if tileRenderer == nil {
		return Track{}
	}

	// Extract video ID
	videoId := ReadValueString(tileRenderer, []interface{}{"contentId"})

	// Extract title
	title := ReadValueString(tileRenderer, []interface{}{
		"metadata", "tileMetadataRenderer", "title", "simpleText",
	})

	// Extract artist from first line of metadata
	// Try runs path first (playlist tracks), then simpleText (search results)
	artistName := ReadValueString(tileRenderer, []interface{}{
		"metadata", "tileMetadataRenderer", "lines", 0,
		"lineRenderer", "items", 0, "lineItemRenderer", "text", "runs", 0, "text",
	})

	if artistName == "" {
		artistName = ReadValueString(tileRenderer, []interface{}{
			"metadata", "tileMetadataRenderer", "lines", 0,
			"lineRenderer", "items", 0, "lineItemRenderer", "text", "simpleText",
		})
	}

	// Build artists array
	artists := []string{}
	if artistName != "" {
		artists = append(artists, artistName)
	}

	// Check for featured artists in title
	cleanTitle, featuredArtists := parseFeaturedArtists(title)
	if len(featuredArtists) > 0 {
		title = cleanTitle
		artists = append(artists, featuredArtists...)
	}

	return Track{
		VideoId: videoId,
		Title:   title,
		Artists: artists,
		Link:    CreateTrackLink(videoId),
	}
}

// ParsePlaylistTracks extracts tracks and continuation token from playlist tracks response
func (p *TVHTML5Parser) ParsePlaylistTracks(jsonResponse interface{}, isFirstPage bool) ([]Track, string) {
	var contents interface{}
	var nextContinuation string

	if isFirstPage {
		// Navigate to the playlist tracks for first page
		contents = ReadValue(jsonResponse, []interface{}{
			"contents", "tvBrowseRenderer", "content", "tvSurfaceContentRenderer",
			"content", "twoColumnRenderer", "rightColumn", "playlistVideoListRenderer",
			"contents",
		})

		// Get continuation token for next page
		nextContinuation = ReadValueString(jsonResponse, []interface{}{
			"contents", "tvBrowseRenderer", "content", "tvSurfaceContentRenderer",
			"content", "twoColumnRenderer", "rightColumn", "playlistVideoListRenderer",
			"continuations", 0, "nextContinuationData", "continuation",
		})
	} else {
		// For continuation pages
		contents = ReadValue(jsonResponse, []interface{}{
			"continuationContents", "playlistVideoListContinuation", "contents",
		})

		nextContinuation = ReadValueString(jsonResponse, []interface{}{
			"continuationContents", "playlistVideoListContinuation",
			"continuations", 0, "nextContinuationData", "continuation",
		})
	}

	tracks := []Track{}

	if contentsList, ok := contents.([]interface{}); ok {
		for _, item := range contentsList {
			track := parseTrackItem(item)
			if track.VideoId != "" {
				tracks = append(tracks, track)
			}
		}
	}

	return tracks, nextContinuation
}

// ParseUserPlaylists extracts user playlists from the library response
func (p *TVHTML5Parser) ParseUserPlaylists(jsonResponse interface{}, isFirstPage bool) ([]YoutubePlaylist, string) {
	var playlistItems interface{}
	var nextContinuation string

	if isFirstPage {
		// Navigate to the grid items for first page
		playlistItems = ReadValue(jsonResponse, []interface{}{
			"contents", "tvBrowseRenderer", "content", "tvSecondaryNavRenderer",
			"sections", 0, "tvSecondaryNavSectionRenderer", "tabs", 1,
			"tabRenderer", "content", "tvSurfaceContentRenderer", "content",
			"gridRenderer", "items",
		})

		// Get continuation token for next page
		nextContinuation = ReadValueString(jsonResponse, []interface{}{
			"contents", "tvBrowseRenderer", "content", "tvSecondaryNavRenderer",
			"sections", 0, "tvSecondaryNavSectionRenderer", "tabs", 1,
			"tabRenderer", "content", "tvSurfaceContentRenderer",
			"continuation", "reloadContinuationData", "continuation",
		})
	} else {
		// For continuation pages - structure may differ
		// TODO: Implement when continuation response structure is known
		playlistItems = ReadValue(jsonResponse, []interface{}{
			"continuationContents", "gridRenderer", "items",
		})

		nextContinuation = ReadValueString(jsonResponse, []interface{}{
			"continuationContents", "gridRenderer", "continuation",
			"reloadContinuationData", "continuation",
		})
	}

	youtubePlaylists := []YoutubePlaylist{}

	if items, ok := playlistItems.([]interface{}); ok {
		for _, item := range items {
			playlist := parseTVHTML5PlaylistItem(item)
			if playlist.PlaylistId != "" {
				youtubePlaylists = append(youtubePlaylists, playlist)
			}
		}
	}

	return youtubePlaylists, nextContinuation
}

// parseTVHTML5PlaylistItem extracts playlist information from a tileRenderer
func parseTVHTML5PlaylistItem(item interface{}) YoutubePlaylist {
	tileRenderer := ReadValue(item, []interface{}{"tileRenderer"})
	if tileRenderer == nil {
		return YoutubePlaylist{}
	}

	// Extract title
	title := ReadValueString(tileRenderer, []interface{}{
		"metadata", "tileMetadataRenderer", "title", "runs", 0, "text",
	})

	// Extract playlist ID from browseId (e.g., "VLLM" -> "LM")
	browseId := ReadValueString(tileRenderer, []interface{}{
		"onSelectCommand", "browseEndpoint", "browseId",
	})

	// Also try from metadata navigation endpoint
	if browseId == "" {
		browseId = ReadValueString(tileRenderer, []interface{}{
			"metadata", "tileMetadataRenderer", "title", "runs", 0,
			"navigationEndpoint", "browseEndpoint", "browseId",
		})
	}

	// Remove "VL" prefix if present
	playlistId := browseId
	if len(playlistId) > 2 && strings.HasPrefix(playlistId, "VL") {
		playlistId = playlistId[2:]
	}

	// Extract thumbnails
	thumbnails := ReadValue(tileRenderer, []interface{}{
		"header", "tileHeaderRenderer", "thumbnail", "thumbnails",
	})

	thumbnailUrls := []string{}
	if thumbsList, ok := thumbnails.([]interface{}); ok {
		for _, thumb := range thumbsList {
			if thumbMap, ok := thumb.(map[string]interface{}); ok {
				if url, ok := thumbMap["url"].(string); ok && url != "" {
					thumbnailUrls = append(thumbnailUrls, url)
				}
			}
		}
	}

	// Extract total tracks from metadata lines
	// The second line typically contains info like "Auto playlist • 5 episodes"
	totalTracks := ""
	metadataText := ReadValueString(tileRenderer, []interface{}{
		"metadata", "tileMetadataRenderer", "lines", 1,
		"lineRenderer", "items", 0, "lineItemRenderer", "text", "simpleText",
	})

	if metadataText != "" {
		totalTracks = extractTrackCountFromMetadata(metadataText)
	}

	return YoutubePlaylist{
		Title:       title,
		Thumbnails:  thumbnailUrls,
		TotalTracks: totalTracks,
		PlaylistId:  playlistId,
		Url:         CreatePlaylistLink(playlistId),
	}
}

// parseFeaturedArtists extracts featured artists from track titles
func parseFeaturedArtists(title string) (string, []string) {
	titleWithFeaturedArtists := tvhtml5TrackTitleWithFeatRegex.FindStringSubmatch(title)

	if len(titleWithFeaturedArtists) > 2 {
		cleanTitle := titleWithFeaturedArtists[1]
		featuredArtist := titleWithFeaturedArtists[2]
		artists := strings.Split(featuredArtist, fmt.Sprintf(" %s ", AND_SEPARATOR))
		return cleanTitle, artists
	}

	return title, []string{}
}

// cleanTrackCount removes common suffixes from track count strings
func cleanTrackCount(totalTracks string) int {
	totalTracks = strings.TrimSpace(totalTracks)
	totalTracks = strings.Replace(totalTracks, " tracks", "", 1)
	totalTracks = strings.Replace(totalTracks, " songs", "", 1)
	totalTracks = strings.ReplaceAll(totalTracks, ",", "")

	count, _ := strconv.Atoi(totalTracks)
	return count
}

// extractTrackCountFromMetadata extracts track/episode count from metadata text
// Examples: "Auto playlist • 5 episodes", "Playlist • 23 songs"
func extractTrackCountFromMetadata(metadataText string) string {
	// Split by bullet point separator
	parts := strings.Split(metadataText, "•")
	if len(parts) < 2 {
		parts = strings.Split(metadataText, "·") // Try alternative separator
	}

	if len(parts) >= 2 {
		// The count is typically in the last part
		countPart := strings.TrimSpace(parts[len(parts)-1])
		// Extract just the number (e.g., "5 episodes" -> "5")
		fields := strings.Fields(countPart)
		if len(fields) > 0 {
			return fields[0]
		}
	}

	return ""
}
