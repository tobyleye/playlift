package config

import (
	"crypto/tls"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/valkey-io/valkey-go"
)

var (
	DB_USER                      string
	DB_PASSWORD                  string
	DB_NAME                      string
	DB_HOST                      string
	DB_PORT                      string
	SPOTIFY_CLIENT_ID            string
	SPOTIFY_CLIENT_SECRET        string
	GOOGLE_CLIENT_ID             string
	GOOGLE_CLIENT_SECRET         string
	STRIPE_SECRET_KEY            string
	SESSION_KEY                  string
	SPOTIFY_CONNECT_REDIRECT_URL string
	FRONTEND_BASE_URL            string
	VALKEY_URL                   string
	VALKEY_USERNAME              string
	VALKEY_PASSWORD              string
	APP_DOMAIN                   string
	VALKEY_CLIENT_OPTIONS        valkey.ClientOption
	REDIS_HOST                   string
	REDIS_PORT                   string
	REDIS_PASSWORD               string
	REDIS_ADDRESS                string
	GO_ENV                       string
	GOOGLE_REDIRECT_URL          string
)

const (
	YOUTUBE_HOST  = "music.youtube.com"
	SPOTIFY_HOST  = "open.spotify.com"
	SPOTIFY       = "spotify"
	YOUTUBE_MUSIC = "youtube_music"
)

func getEnvOrThrow(varname string) string {
	envValue := os.Getenv(varname)
	if envValue == "" {
		log.Fatal(varname + " is not set")
	}
	return envValue
}

func getEnv(name string, _default string) string {
	val := os.Getenv(name)
	if val == "" {
		val = _default
	}
	return val
}

func IsProd() bool {
	fmt.Println("go env...", GO_ENV)
	return GO_ENV == "production"
}

func LoadEnv() {
	fmt.Println("initializing env variables...")

	err := godotenv.Load()

	if err != nil {
		log.Fatal("Error occured loading the project .env")
	}

	GO_ENV := os.Getenv("GO_ENV")

	DB_USER = getEnvOrThrow("DB_USER")
	DB_PASSWORD = getEnvOrThrow("DB_PASSWORD")
	DB_NAME = getEnvOrThrow("DB_NAME")
	DB_HOST = getEnvOrThrow("DB_HOST")
	DB_PORT = getEnvOrThrow("DB_PORT")

	SPOTIFY_CLIENT_ID = getEnvOrThrow("SPOTIFY_CLIENT_ID")

	SPOTIFY_CLIENT_SECRET = getEnvOrThrow("SPOTIFY_CLIENT_SECRET")

	GOOGLE_CLIENT_ID = getEnvOrThrow("GOOGLE_CLIENT_ID")

	GOOGLE_CLIENT_SECRET = getEnvOrThrow("GOOGLE_CLIENT_SECRET")

	SESSION_KEY = getEnvOrThrow("SESSION_KEY")

	STRIPE_SECRET_KEY = os.Getenv("STRIPE_SECRET_KEY")

	FRONTEND_BASE_URL = os.Getenv("FRONTEND_BASE_URL")
	GOOGLE_REDIRECT_URL = FRONTEND_BASE_URL

	SPOTIFY_CONNECT_REDIRECT_URL = getEnv(`SPOTIFY_REDIRECT_URL`, fmt.Sprintf(`%s/convert/connect-spotify`, FRONTEND_BASE_URL))

	VALKEY_URL = getEnvOrThrow("VALKEY_URL")

	APP_DOMAIN = os.Getenv("APP_DOMAIN")
	REDIS_HOST = getEnvOrThrow("REDIS_HOST")
	REDIS_PORT = getEnvOrThrow("REDIS_PORT")

	REDIS_ADDRESS = fmt.Sprintf("%s:%s", REDIS_HOST, REDIS_PORT)
	REDIS_PASSWORD = os.Getenv("REDIS_PASSWORD")

	if GO_ENV == "production" {
		VALKEY_CLIENT_OPTIONS = valkey.ClientOption{
			InitAddress: []string{VALKEY_URL},
			Username:    getEnvOrThrow("VALKEY_USERNAME"),
			Password:    getEnvOrThrow("VALKEY_PASSWORD"),
			TLSConfig:   &tls.Config{},
		}
	} else {
		VALKEY_CLIENT_OPTIONS = valkey.ClientOption{
			InitAddress: []string{VALKEY_URL},
		}

	}
}

func init() {
	LoadEnv()
}
