package main

import (
	"context"
	"encoding/gob"
	"fmt"
	"html/template"
	"io"
	"log"
	"os"
	"time"

	"github.com/gorilla/sessions"
	_ "github.com/joho/godotenv/autoload"

	echoSession "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/db"
	"github.com/tobyleye/playlift/handlers"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/session"
)

type Template struct {
	templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func ensureLogin(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		user, err := session.GetUserFromSession(c)
		if err != nil {
			log.Println("error getting user session in middleware", err)
			return c.JSON(401, map[string]string{"error": "unauthorized"})
		}
		if user.UserId == "" {
			return c.JSON(401, map[string]string{"error": "unauthorized"})
		}

		c.Set("user", user)
		return next(c)
	}
}

func main() {
	// loads and initializes environment variables
	config.LoadEnv()
	// Register the UserSession type with gob for session serialization
	gob.Register(session.UserSession{})

	var SessionStore = sessions.NewCookieStore([]byte(config.SESSION_KEY))

	db, err := db.OpenDb()

	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}

	log.Println("DB connected ✅")

	db.AutoMigrate(
		&models.User{},
		&models.PlaylistConversion{},
		&models.Token{},
		&models.Conversion{},
	)

	e := echo.New()
	e.Use(echoSession.Middleware(SessionStore))

	var corsConfig = middleware.DefaultCORSConfig
	corsConfig.AllowCredentials = true
	corsConfig.AllowOrigins = []string{
		os.Getenv("FRONTEND_BASE_URL"),
	}

	e.Use(middleware.CORSWithConfig(corsConfig))

	e.Renderer = &Template{
		templates: nil,
	}

	ctx := context.Background()

	if err != nil {
		panic(err)
	}

	handlers := handlers.Handlers{
		Db:           db,
		Context:      ctx,
		SessionStore: SessionStore,
	}

	// define api routes
	// public routes
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(200,
			map[string]string{
				"status": "ok",
				"time":   time.Now().Format(time.RFC3339),
			})
	})

	e.POST("/login/google/callback", handlers.LoginWithGoogleCallback)

	// private routes
	privateRoutes := e.Group("", ensureLogin)

	privateRoutes.POST("/connect/spotify/callback", handlers.SpotifyLoginCallback, ensureLogin)

	privateRoutes.GET("/user/session", handlers.GetUserSession, ensureLogin)

	privateRoutes.POST("/convert", handlers.Convert)
	privateRoutes.GET("/conversions/:id", handlers.GetSingleConversion)
	privateRoutes.POST("/conversions/:id/restart", handlers.RestartConversion)
	privateRoutes.DELETE("/conversions/:id", handlers.DeleteConversion)
	privateRoutes.GET("/conversions", handlers.GetAllConversions)

	privateRoutes.GET("/playlists/youtube", handlers.FetchUserYoutubePlaylists)
	privateRoutes.GET("/playlists/spotify", handlers.FetchUserSpotifyPlaylists)
	privateRoutes.GET("/connection-status", handlers.GetConnectionStatus)
	privateRoutes.POST("/logout", handlers.Logout)

	// serve frontend. this should always be done after routes are registered
	port := os.Getenv("PORT")

	fmt.Println("Starting server on port:", port)
	e.Logger.Fatal(e.Start(fmt.Sprintf(":%s", port)))
}
