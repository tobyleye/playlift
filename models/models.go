package models

import (
	"time"
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
}

type Conversion struct {
	Title               string                 `gorm:"column:title" json:"title"`
	ID                  string                 `gorm:"primaryKey" json:"id"`
	Link                string                 `gorm:"column:link" json:"link"`
	ResourceType        string                 `gorm:"column:resource_type" json:"resource_type"`
	ResourceId          string                 `gorm:"column:resource_id" json:"resource_id"`
	SourcePlatform      string                 `gorm:"column:source_platform" json:"source_platform"`
	DestinationPlatform string                 `gorm:"column:destination_platform" json:"destination_platform"`
	CreatedAt           time.Time              `gorm:"column:created_at" json:"created_at"`
	Status              string                 `gorm:"column:status" json:"status"`
	PlaylistInfo        interface{}            `gorm:"serializer:json;column:playlist_info" json:"playlist_info"`
	Result              map[string]interface{} `gorm:"serializer:json;column:result" json:"result"`
	UserId              string                 `gorm:"column:user_id" json:"user_id"`
	User                User
}

type PlatformsConnectionStatus struct {
	UserId       string `gorm:"primaryKey" json:"user_id"`
	Spotify      bool   `json:"spotify"`
	YoutubeMusic bool   `json:"youtube_music"`
}
