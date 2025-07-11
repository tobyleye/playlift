package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

var (
	SPOTIFY_CLIENT_ID            string
	SPOTIFY_CLIENT_SECRET        string
	GOOGLE_CLIENT_ID             string
	GOOGLE_CLIENT_SECRET         string
	STRIPE_SECRET_KEY            string
	SESSION_KEY                  string
	SPOTIFY_CONNECT_REDIRECT_URL string
	FRONTEND_BASE_URL            string
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

func LoadEnv() {

	err := godotenv.Load()

	if err != nil {
		log.Fatal("Error occured loading the project .env")
	}

	SPOTIFY_CLIENT_ID = getEnvOrThrow("SPOTIFY_CLIENT_ID")

	SPOTIFY_CLIENT_SECRET = getEnvOrThrow("SPOTIFY_CLIENT_SECRET")

	GOOGLE_CLIENT_ID = getEnvOrThrow("GOOGLE_CLIENT_ID")

	GOOGLE_CLIENT_SECRET = getEnvOrThrow("GOOGLE_CLIENT_SECRET")

	SESSION_KEY = getEnvOrThrow("SESSION_KEY")

	STRIPE_SECRET_KEY = os.Getenv("STRIPE_SECRET_KEY")

	FRONTEND_BASE_URL = os.Getenv("FRONTEND_BASE_URL")

	SPOTIFY_CONNECT_REDIRECT_URL = FRONTEND_BASE_URL + "/convert/connect-spotify"

}

func init() {
	// LoadEnv()
}
