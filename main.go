package main

import (
	"context"
	"encoding/gob"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/sessions"
	_ "github.com/joho/godotenv/autoload"
	"github.com/valkey-io/valkey-go"
	"gorm.io/gorm"

	"github.com/gorilla/websocket"
	"github.com/hibiken/asynq"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/tobyleye/playlift/config"
	core "github.com/tobyleye/playlift/core"
	cronjobs "github.com/tobyleye/playlift/cron-jobs"
	"github.com/tobyleye/playlift/db"
	"github.com/tobyleye/playlift/handlers"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/server"
	"github.com/tobyleye/playlift/session"
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			fmt.Println("checking origin inside websocket..")
			return true
		},
	}
)

type SocketHandler struct {
	db     *gorm.DB
	pubsub valkey.Client
}

func (h *SocketHandler) Handle(c echo.Context) error {
	log.Println("inside socket handler...")
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer ws.Close()

	conversionId := c.Param("id")
	log.Println("listening for  conversion: ", conversionId)
	// go func() {
	ctx := context.TODO()
	err = h.pubsub.Receive(
		ctx,
		h.pubsub.B().Subscribe().Channel(conversionId).Build(),
		func(msg valkey.PubSubMessage) {

			fmt.Printf(
				"Channel: %s, Message: %s\n",
				msg.Channel,
				msg.Message,
			)

			err := ws.WriteMessage(websocket.TextMessage, []byte(msg.Message))
			if err != nil {
				fmt.Println("failed to write ws message", err)
			}
		},
	)

	return nil

	// for {
	// 	// Write
	// 	err := ws.WriteMessage(websocket.TextMessage, []byte("Hello, Client!"))
	// 	if err != nil {
	// 		c.Logger().Error("failed to write WS message", "error", err)
	// 	}

	// 	// Read
	// 	_, msg, err := ws.ReadMessage()
	// 	if err != nil {
	// 		c.Logger().Error("failed to read WS message", "error", err)
	// 	}
	// 	fmt.Printf("%s\n", msg)
	// }
}

func main() {
	// loads and initializes environment variables

	// err := godotenv.Load()
	// config.LoadEnv()

	// if err != nil {
	// 	log.Fatal("Error occurred loading the project .env", err)
	// }
	dir, err := os.Getwd()
	log.Println("[main] working directory is: " + dir)

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
		&models.SystemToken{},
	)

	if err != nil {
		log.Println("error running migration..", err)
	}

	redisAddr := fmt.Sprintf("%s:%s", config.REDIS_HOST, config.REDIS_PORT)
	fmt.Println("connecting to redis", redisAddr)

	client := asynq.NewClient(
		asynq.RedisClientOpt{
			Addr:     redisAddr,
			Password: config.REDIS_PASSWORD,
		})

	err = client.Ping()
	if err != nil {
		log.Fatal("Error connecting to Asynq Redis:", err)
	}

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

	ctx := context.Background()

	fmt.Println("valkey client options {init address}...", config.VALKEY_CLIENT_OPTIONS.InitAddress, config.VALKEY_CLIENT_OPTIONS.Username, config.VALKEY_CLIENT_OPTIONS.Password)

	cache, err := valkey.NewClient(config.VALKEY_CLIENT_OPTIONS)

	if err != nil {
		log.Fatal("Error connecting to Redis:", err)
	}

	res, _ := cache.Do(ctx, cache.B().Ping().Build()).ToString()

	log.Println("Valkey connected ✅", res)

	appSpotifyClient := core.NewAppSpotifyClient()
	publicYTMusicClient := core.NewPublicYTMusicClient(db)

	Handlers := handlers.Handlers{
		Db:                  db,
		Context:             ctx,
		SessionStore:        SessionStore,
		Cache:               cache,
		AsynqClient:         client,
		AppSpotifyClient:    appSpotifyClient,
		PublicYTMusicClient: publicYTMusicClient,
	}

	server := server.NewServer(
		Handlers,
		SessionStore,
	)

	socketHandler := &SocketHandler{db: db, pubsub: cache}

	server.GET("/conversions/:id/subscribe", socketHandler.Handle)

	if err := cronjobs.StartCronJobs(db, client); err != nil {
		log.Println("failed to start cron jobs", err)
	}

	// serve frontend. this should always be done after routes are registered

	port := os.Getenv("PORT")

	fmt.Println("Starting server on port:", port)
	server.Logger.Fatal(server.Start(fmt.Sprintf(":%s", port)))

}
