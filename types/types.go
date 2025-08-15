package types

import "encoding/json"

type Track struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Artists   []string `json:"artists"`
	Thumbnail string   `json:"thumbnail"`
	Link      string   `json:"link"`
	Album     string   `json:"album"`
}

func (t Track) MarshalBinary() ([]byte, error) {
	return json.Marshal(t) // Marshal the struct into JSON bytes
}

// UnmarshalBinary implements the encoding.BinaryUnmarshaler interface (optional but good practice)
func (t *Track) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, t) // Unmarshal JSON bytes back into the struct
}

type TracksList struct {
	Total  int     `json:"total"`
	Tracks []Track `json:"tracks"`
}

type SimplePlaylist struct {
	Name      string     `json:"name"`
	Tracks    TracksList `json:"tracks"`
	Thumbnail string     `json:"thumbnail"`
}

type SimplePlaylistPageItem struct {
	Url         string   `json:"url"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	TotalTracks int      `json:"total_tracks"`
	Thumbnails  []string `json:"thumbnails"`
	PlaylistId  string   `json:"playlist_id"`
}

type SpotifyPlaylistPage struct {
	TotalCount int                      `json:"total_count"`
	Playlists  []SimplePlaylistPageItem `json:"playlists"`
	NextPage   int                      `json:"next_page"`
}

type SearchQuery struct {
	Title   string   `json:"title"`
	Artists []string `json:"artists"`
	Type    string   `json:"type"`
}
