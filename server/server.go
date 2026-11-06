package server

import (
	"context"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/sessions"
	echoSession "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/tobyleye/playlift/config"
	"github.com/tobyleye/playlift/handlers"
	globalHandlers "github.com/tobyleye/playlift/handlers"
	"github.com/tobyleye/playlift/session"
	"github.com/valkey-io/valkey-go"
)

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

type Template struct {
	templates *template.Template
}

func (t *Template) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func NewServer(handlers handlers.Handlers, sessionStore sessions.Store) *echo.Echo {
	e := echo.New()
	e.Use(echoSession.Middleware(sessionStore))

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

	fmt.Println("valkey client options {init address}...", config.VALKEY_CLIENT_OPTIONS.InitAddress, config.VALKEY_CLIENT_OPTIONS.Username, config.VALKEY_CLIENT_OPTIONS.Password)

	cache, err := valkey.NewClient(config.VALKEY_CLIENT_OPTIONS)

	if err != nil {
		log.Fatal("Error connecting to Redis:", err)
	}

	res, _ := cache.Do(ctx, cache.B().Ping().Build()).ToString()

	log.Println("Valkey connected ✅", res)

	// Load templates
	// define api routes
	// public routes

	api := e.Group("/api")

	api.GET("/health", func(c echo.Context) error {
		return c.JSON(200,
			map[string]string{
				"status": "ok",
				"time":   time.Now().Format(time.RFC3339),
			})
	})

	// ------- auth endpoints ----------
	api.POST("/login/google/callback", handlers.LoginWithGoogleCallback)

	// --------- guest endpoints  ----------
	guest := api.Group("")

	// guest.Use(handlers.InitGuestSessionMiddleware)

	guest.POST("/guest/convert", handlers.ConvertPlaylist)
	guest.GET("/guest/loadplaylist", handlers.LoadPlaylist)
	guest.GET("/guest/conversions", handlers.GetGuestConversions)

	guest.GET("/guest/hello", globalHandlers.TestHandler)
	guest.GET("/guest/conversion-status/:conversionId", handlers.ViewConversionStatus)
	// ----- private routes --------
	privateRoutes := api.Group("", ensureLogin)

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

	// socketHandler := &SocketHandler{db: db, pubsub: cache}

	// privateRoutes.GET("/conversions/:id/subscribe", socketHandler.Handle)

	return e
}
