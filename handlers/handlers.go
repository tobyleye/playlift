package handlers

import (
	"context"

	"github.com/gorilla/sessions"
	"github.com/zmb3/spotify/v2"
	"google.golang.org/api/youtube/v3"
	"gorm.io/gorm"
)

type Handlers struct {
	Db            *gorm.DB
	SpotifyClient *spotify.Client
	Context       context.Context
	YoutubeClient *youtube.Service
	SessionStore  *sessions.CookieStore
}
