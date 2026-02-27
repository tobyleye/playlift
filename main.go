package main

import (
	"context"
	"encoding/gob"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/sessions"
	_ "github.com/joho/godotenv/autoload"
	"github.com/valkey-io/valkey-go"

	"github.com/hibiken/asynq"
	echoSession "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/tobyleye/playlift/config"
	cronjobs "github.com/tobyleye/playlift/cron-jobs"
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

	err = db.AutoMigrate(
		&models.User{},
		&models.PlaylistConversion{},
		&models.Token{},
		&models.ConversionWatch{},
	)

	if err != nil {
		log.Println("error running migration..", err)
	}

	client := asynq.NewClient(asynq.RedisClientOpt{
		Addr:     fmt.Sprintf("%s:%s", config.REDIS_HOST, config.REDIS_PORT),
		Password: config.REDIS_PASSWORD,
	})

	err = client.Ping()
	if err != nil {
		log.Fatal("Error connecting to Asynq Redis:", err)
	}

	// Start the watch sync scheduler (runs every 10 minutes)
	// scheduler.StartWatchSyncScheduler(db, 10)

	e := echo.New()
	e.Use(echoSession.Middleware(SessionStore))

	corsConfig := middleware.CORSConfig{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}

	if config.IsProd() {
		corsConfig.AllowOrigins = []string{
			"https://playlift.lol",
			"https://www.playlift.lol",
		}
	} else {
		corsConfig.AllowOrigins = []string{
			config.FRONTEND_BASE_URL,
			"http://127.0.0.1:3500",
			"http://localhost:3500",
		}

	}

	e.Use(middleware.CORSWithConfig(corsConfig))

	// Optional: Explicit OPTIONS handler for debugging
	e.OPTIONS("/*", func(c echo.Context) error {
		return c.NoContent(http.StatusOK)
	})

	e.Renderer = &Template{
		templates: nil,
	}

	ctx := context.Background()

	cache, err := valkey.NewClient(config.VALKEY_CLIENT_OPTIONS)

	if err != nil {
		log.Fatal("Error connecting to Redis:", err)
	}

	res, _ := cache.Do(ctx, cache.B().Ping().Build()).ToString()

	log.Println("Valkey connected ✅", res)

	handlers := handlers.Handlers{
		Db:           db,
		Context:      ctx,
		SessionStore: SessionStore,
		Cache:        cache,
		AsynqClient:  client,
	}

	// Load templates
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
	privateRoutes.POST("/deactivate-account", handlers.DeactivateAccount)

	if err := cronjobs.StartCronJobs(db, client); err != nil {
		log.Println("failed to start cron jobs", err)
	}

	// serve frontend. this should always be done after routes are registered

	port := os.Getenv("PORT")

	fmt.Println("Starting server on port:", port)
	e.Logger.Fatal(e.Start(fmt.Sprintf(":%s", port)))
}
