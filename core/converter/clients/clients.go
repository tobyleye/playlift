package clients

import "github.com/tobyleye/playlift/types"

type ConverterClient interface {
	GetPlaylistDetails(playlistId string) (types.PlaylistDetails, error)
	GetPlaylistTracks(playlistId string, count interface{}) ([]types.Track, error)
	SearchTrack(title string, artists []string) (*types.Track, error)
	CreatePlaylist(playlistTitle string, playlistDescription string, tracks []string) (string, string, error)
	AddTracksToPlaylist(playlistId string, tracks []string) error
}
