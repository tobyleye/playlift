package models

import (
	"time"

	"github.com/tobyleye/playlift/types"
)

// ****** ------- models ----------- *****

type Token struct {
	ID           uint      `gorm:"primaryKey;autoIncrement;unique" json:"_id"`
	UserId       string    `gorm:"size:200;not null" json:"user_id"`
	Platform     string    `json:"platform"`
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	TokenType    string    `json:"token_type"`
	ExpiresIn    time.Time `json:"expires_in"`
	CreatedAt    time.Time `json:"created_at"`
}

type User struct {
	UserId    string    `gorm:"primaryKey;size:200;unique" json:"user_id"`
	Email     string    `gorm:"size:200;unique" json:"username"`
	Name      string    `gorm:"size:200" json:"name"`
	Picture   string    `json:"picture"`
	CreatedAt time.Time `json:"created_at"`
	Tokens    []Token
	SpotifyId string `json:"spotify_id"`
	YoutubeId string `json:"youtube_id"`
	Active    bool   `gorm:"default:true" json:"active"`
}

// type PlaylistTrack struct {
// 	TrackId string   `gorm:"primaryKey;column:track_id" json:"track_id"`
// 	Title   string   `gorm:"column:title" json:"title"`
// 	Artists []string `gorm:"column:artists" json:"artists"`
// 	Album   string   `gorm:"column:album" json:"album"`
// }

type TrackConversionResult struct {
	Error string `json:"error,omitempty"`
	Data  string `json:"data,omitempty"`
}

type PlaylistConversion struct {
	ConversionID        string                           `gorm:"primaryKey;column:conversion_id" json:"conversion_id"`
	PlaylistId          string                           `gorm:"column:playlist_id" json:"playlist_id"`
	PlaylistTitle       string                           `gorm:"column:playlist_title" json:"playlist_title"`
	PlaylistLink        string                           `gorm:"column:playlist_link" json:"playlist_link"`
	SourcePlatform      string                           `gorm:"column:source_platform" json:"source_platform"`
	DestinationPlatform string                           `gorm:"column:destination_platform" json:"destination_platform"`
	Status              string                           `gorm:"column:status" json:"status"`
	TotalTracks         int                              `gorm:"column:total_tracks" json:"total_tracks"`
	CreatedAt           time.Time                        `gorm:"column:created_at" json:"created_at"`
	UserId              string                           `gorm:"column:user_id" json:"user_id"`
	PlaylistTracks      []types.Track                    `gorm:"serializer:json;column:playlist_tracks" json:"playlist_tracks"`
	Result              map[string]TrackConversionResult `gorm:"serializer:json;column:result" json:"result"`
	CreatedPlaylistLink string                           `gorm:"column:created_playlist_link" json:"created_playlist_link"`
	TimeTaken           float64                          `gorm:"column:time_taken" json:"time_taken"`
}
