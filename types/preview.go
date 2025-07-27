package types

type SimpleTrack struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Artists   []string `json:"artists"`
	Thumbnail string   `json:"thumbnail"`
	Link      string   `json:"link"`
	Snippet   any      `json:"snippet"`
}

type SimpleTracks struct {
	Total  int           `json:"total"`
	Tracks []SimpleTrack `json:"tracks"`
}

type SimplePlaylist struct {
	Name      string       `json:"name"`
	Tracks    SimpleTracks `json:"tracks"`
	Thumbnail string       `json:"thumbnail"`
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
