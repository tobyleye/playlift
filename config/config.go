package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

var (
	GOOGLE_API_KEY               string
	SPOTIFY_CLIENT_ID            string
	SPOTIFY_CLIENT_SECRET        string
	GOOGLE_CLIENT_ID             string
	GOOGLE_CLIENT_SECRET         string
	STRIPE_SECRET_KEY            string
	SESSION_KEY                  string
	SERVER_BASE_URL              string
	GOOGLE_LOGIN_REDIRECT_URL    string
	GOOGLE_CONNECT_REDIRECT_URL  string
	SPOTIFY_CONNECT_REDIRECT_URL string
)

const (
	YOUTUBE_HOST = "music.youtube.com"
	SPOTIFY_HOST = "open.spotify.com"
)

func getEnvOrThrow(varname string) string {
	envValue := os.Getenv(varname)
	if envValue == "" {
		log.Fatal(varname + " is not set")
	}
	return envValue
}
func init() {

	err := godotenv.Load()

	if err != nil {
		log.Println("Error loading .env file")
	}

	GOOGLE_API_KEY = getEnvOrThrow("GOOGLE_API_KEY")

	SPOTIFY_CLIENT_ID = getEnvOrThrow("SPOTIFY_CLIENT_ID")

	SPOTIFY_CLIENT_SECRET = getEnvOrThrow("SPOTIFY_CLIENT_SECRET")

	GOOGLE_CLIENT_ID = getEnvOrThrow("GOOGLE_CLIENT_ID")

	GOOGLE_CLIENT_SECRET = getEnvOrThrow("GOOGLE_CLIENT_SECRET")

	SESSION_KEY = getEnvOrThrow("SESSION_KEY")

	STRIPE_SECRET_KEY = os.Getenv("STRIPE_SECRET_KEY")

	SERVER_BASE_URL = getEnvOrThrow("SERVER_BASE_URL")

	GOOGLE_LOGIN_REDIRECT_URL = SERVER_BASE_URL + "/login/google/callback"

	GOOGLE_CONNECT_REDIRECT_URL = SERVER_BASE_URL + "/connect/youtube/callback"
	SPOTIFY_CONNECT_REDIRECT_URL = SERVER_BASE_URL + "/connect/spotify/callback"

}
