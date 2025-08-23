package clients

import "github.com/tobyleye/playlift/types"

type PlatformClient interface {
	GetPlaylistDetails(playlistId string) (types.PlaylistDetails, error)
	GetPlaylistTracks(playlistId string) ([]types.Track, error)
	SearchTrack(title string, artists []string) (*types.Track, error)
	CreatePlaylist(playlistTitle string, playlistDescription string, tracks []string) (string, error)
}
