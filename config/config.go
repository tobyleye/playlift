package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

var (
	GOOGLE_API_KEY        string
	SPOTIFY_CLIENT_ID     string
	SPOTIFY_CLIENT_SECRET string
	GOOGLE_CLIENT_ID      string
	GOOGLE_CLIENT_SECRET  string
	STRIPE_SECRET_KEY     string
	SESSION_KEY           string
)

const (
	YOUTUBE_HOST      = "music.youtube.com"
	SPOTIFY_HOST      = "open.spotify.com"
	FRONTEND_BASE_URL = "http://localhost:3500"
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
		log.Fatal("Error loading .env file")
	} else {
		GOOGLE_API_KEY = getEnvOrThrow("GOOGLE_API_KEY")

		SPOTIFY_CLIENT_ID = getEnvOrThrow("SPOTIFY_CLIENT_ID")

		SPOTIFY_CLIENT_SECRET = getEnvOrThrow("SPOTIFY_CLIENT_SECRET")

		GOOGLE_CLIENT_ID = getEnvOrThrow("GOOGLE_CLIENT_ID")

		GOOGLE_CLIENT_SECRET = getEnvOrThrow("GOOGLE_CLIENT_SECRET")

		STRIPE_SECRET_KEY = getEnvOrThrow("STRIPE_SECRET_KEY")
		SESSION_KEY = getEnvOrThrow("SESSION_KEY")

	}

}
