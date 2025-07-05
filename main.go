package main

import (
	"context"
	"fmt"
	"html/template"
	"io"
	"log"
	"os"

	"github.com/go-sql-driver/mysql"
	"github.com/gorilla/sessions"
	_ "github.com/joho/godotenv/autoload"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/tobyleye/playlist-converter/config"
	"github.com/tobyleye/playlist-converter/handlers"
	"github.com/tobyleye/playlist-converter/models"
	"github.com/zmb3/spotify/v2"
	spotifyAuth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2/clientcredentials"
	"google.golang.org/api/option"
	"google.golang.org/api/youtube/v3"

	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Template struct {
	templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func ensureLogin(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		user, err := session.Get("user", c)
		if err != nil {
			log.Println("error getting user session:", err)
			return c.JSON(500, map[string]string{"error": "internal server error"})
		}
		userId := user.Values["userId"]
		if userId == nil {
			return c.JSON(401, map[string]string{"error": "unauthorized"})
		}

		c.Set("user", user.Values)
		return next(c)
	}
}

func main() {
	// loads and initializes environment variables
	config.LoadEnv()

	var SessionStore = sessions.NewCookieStore([]byte(config.SESSION_KEY))

	fmt.Println("google api key:", config.GOOGLE_API_KEY)

	dbConfig := mysql.Config{
		User:                 os.Getenv("DB_USER"),
		Passwd:               os.Getenv("DB_PASSWORD"),
		DBName:               os.Getenv("DB_NAME"),
		Net:                  "tcp",
		Addr:                 fmt.Sprintf("%s:%s", os.Getenv("DB_HOST"), os.Getenv("DB_PORT")),
		AllowNativePasswords: true,
		ParseTime:            true,
	}
	dbConnUrl := dbConfig.FormatDSN()
	db, err := gorm.Open(gormMysql.Open(dbConnUrl))

	db.AutoMigrate(
		&models.User{},
		&models.PlaylistConversion{},
		&models.Token{},
		&models.Conversion{},
	)

	if err != nil {
		panic(err)
	}

	e := echo.New()
	e.Use(session.Middleware(SessionStore))

	var corsConfig = middleware.DefaultCORSConfig
	corsConfig.AllowCredentials = true
	corsConfig.AllowOrigins = []string{"http://localhost:3500"}

	e.Use(middleware.CORSWithConfig(corsConfig))

	e.Renderer = &Template{
		templates: nil,
	}

	ctx := context.Background()
	oauthConfig := clientcredentials.Config{
		ClientID:     config.SPOTIFY_CLIENT_ID,
		ClientSecret: config.SPOTIFY_CLIENT_SECRET,
		TokenURL:     spotifyAuth.TokenURL,
	}
	token, err := oauthConfig.Token(ctx)
	if err != nil {
		panic(err)
	}

	httpClient := spotifyAuth.New().Client(ctx, token)
	spotifyClient := spotify.New(httpClient)
	youtubeClient, _ := youtube.NewService(ctx, option.WithAPIKey(config.GOOGLE_API_KEY))

	handlers := handlers.Handlers{
		Db:            db,
		Context:       ctx,
		SpotifyClient: spotifyClient,
		YoutubeClient: youtubeClient,
		SessionStore:  SessionStore,
	}

	// define api routes
	e.POST("/login/google/callback", handlers.LoginWithGoogleCallback)

	e.POST("/connect/spotify/callback", handlers.SpotifyLoginCallback, ensureLogin)

	// e.GET("/connect/youtube", handlers.YoutubeConnect, ensureLogin)
	// e.GET("/connect/youtube/callback", handlers.YoutubeConnectCallback, ensureLogin)

	privateRoutes := e.Group("", ensureLogin)

	privateRoutes.GET("/user/session", handlers.GetUserSession, ensureLogin)

	privateRoutes.POST("/convert", handlers.Convert)
	privateRoutes.GET("/conversions/:id", handlers.GetSingleConversion)
	privateRoutes.POST("/conversions/:id/restart", handlers.RestartConversion)
	privateRoutes.DELETE("/conversions/:id", handlers.DeleteConversion)
	privateRoutes.GET("/conversions", handlers.GetAllConversions)

	privateRoutes.GET("/playlists/youtube", handlers.FetchUserYoutubePlaylists)
	privateRoutes.GET("/playlists/spotify", handlers.FetchUserSpotifyPlaylists)

	// serve frontend. this should always be done after routes are registered
	port := os.Getenv("PORT")

	fmt.Println("Starting server on port:", port)
	e.Logger.Fatal(e.Start(fmt.Sprintf(":%s", port)))
}
