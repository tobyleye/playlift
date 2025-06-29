package main

import (
	"context"
	"fmt"
	"html/template"
	"io"
	"os"

	"github.com/go-sql-driver/mysql"
	"github.com/gorilla/sessions"
	_ "github.com/joho/godotenv/autoload"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	AppConfig "github.com/tobyleye/playlist-converter/config"
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

var (
	GOOGLE_API_KEY        = os.Getenv("GOOGLE_API_KEY")
	SPOTIFY_CLIENT_ID     = os.Getenv("SPOTIFY_CLIENT_ID")
	SPOTIFY_CLIENT_SECRET = os.Getenv("SPOTIFY_CLIENT_SECRET")
)

var SessionStore = sessions.NewCookieStore([]byte(AppConfig.SESSION_KEY))

func ensureLogin(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		user, _ := session.Get("user", c)
		userId := user.Values["userId"]
		if userId == nil {
			return c.JSON(401, map[string]string{"error": "unauthorized"})
		}

		c.Set("user", user.Values)
		return next(c)
	}
}

func serveFrontend(e *echo.Echo) {
	// Serve frontend in production mode
	// Check environment mode
	// appEnv := os.Getenv("APP_ENV")

	fmt.Println("registering frontend route")
	// if appEnv == "production" {
	// e.Static("/", "./web/dist")
	// frontendHandler := http.FileServer(http.Dir("client/build"))

	e.Static("/assets", "./web/dist/assets") // Adjust the path if necessary
	e.Static("/js", "./web/dist/js")         // Serve JS if it's in a separate folder
	e.Static("/css", "./web/dist/css")       // Serve CSS if in a separate folder

	e.GET("/", func(c echo.Context) error {
		return c.File("./web/dist/index.html")
	})

	e.GET("/*", func(c echo.Context) error {
		fmt.Println("inside global route")
		return c.File("./web/dist/index.html")
	})

}

func main() {

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

	db.AutoMigrate(&models.User{}, &models.Token{}, &models.Conversion{})

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
	config := clientcredentials.Config{
		ClientID:     AppConfig.SPOTIFY_CLIENT_ID,
		ClientSecret: AppConfig.SPOTIFY_CLIENT_SECRET,
		TokenURL:     spotifyAuth.TokenURL,
	}
	token, err := config.Token(ctx)
	if err != nil {
		panic(err)
	}

	httpClient := spotifyAuth.New().Client(ctx, token)
	spotifyClient := spotify.New(httpClient)
	youtubeClient, _ := youtube.NewService(ctx, option.WithAPIKey(AppConfig.GOOGLE_API_KEY))

	handlers := handlers.Handlers{
		Db:            db,
		Context:       ctx,
		SpotifyClient: spotifyClient,
		YoutubeClient: youtubeClient,
		SessionStore:  SessionStore,
	}

	// define api routes
	e.GET("/login/google", handlers.LoginWithGoogle)
	e.GET("/login/google/callback", handlers.LoginWithGoogleCallback)

	e.GET("/connect/spotify", handlers.SpotifyLogin, ensureLogin)
	e.GET("/connect/spotify/callback", handlers.SpotifyLoginCallback, ensureLogin)

	e.GET("/connect/youtube", handlers.YoutubeConnect, ensureLogin)
	e.GET("/connect/youtube/callback", handlers.YoutubeConnectCallback, ensureLogin)

	//api routes
	api := e.Group("/api")
	api.GET("/preview", handlers.PreviewLink)

	privateRoutes := api.Group("", ensureLogin)

	privateRoutes.POST("/convert", handlers.Convert)
	privateRoutes.GET("/conversions/:id", handlers.GetSingleConversion)
	privateRoutes.POST("/conversions/:id/restart", handlers.RestartConversion)
	privateRoutes.DELETE("/conversions/:id", handlers.DeleteConversion)
	privateRoutes.GET("/conversions", handlers.GetAllConversions)
	privateRoutes.GET("/user/session", handlers.GetUserSession)

	privateRoutes.GET("/playlists/youtube", handlers.FetchUserYoutubePlaylists)
	privateRoutes.GET("/playlists/spotify", handlers.FetchUserSpotifyPlaylists)

	// serve frontend. this should always be done after routes are registered
	serveFrontend(e)

	port := os.Getenv("PORT")

	fmt.Println("Starting server on port:", port)
	e.Logger.Fatal(e.Start(fmt.Sprintf(":%s", port)))
}
