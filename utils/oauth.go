package utils

import (
	"context"
	"net/http"

	"github.com/tobyleye/playlist-converter/config"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var GoogleConnectConfig = oauth2.Config{
	ClientID:     config.GOOGLE_CLIENT_ID,
	ClientSecret: config.GOOGLE_CLIENT_SECRET,
	Endpoint:     google.Endpoint,
	RedirectURL:  "http://localhost:8181/callback/youtube",
	Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/youtube"},
}

func CreateHTTPClient(ctx context.Context, tokens *oauth2.Token) *http.Client {
	return GoogleConnectConfig.Client(ctx, tokens)

}
