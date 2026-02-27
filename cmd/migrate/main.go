package main

import (
	"fmt"
	"log"
	"os"

	_ "github.com/joho/godotenv/autoload"
	"github.com/tobyleye/playlift/db"
	_ "github.com/tobyleye/playlift/db/migrations"

	goosepkg "github.com/tobyleye/playlift/db/migrations"
)

func main() {
	command := "up"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}

	validCommands := map[string]bool{
		"up":      true,
		"down":    true,
		"status":  true,
		"version": true,
		"redo":    true,
	}

	if !validCommands[command] {
		fmt.Printf("Unknown command: %s\n", command)
		fmt.Println("Available commands: up, down, status, version, redo")
		os.Exit(1)
	}

	gormDB, err := db.OpenDb()
	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}

	sqlDB, err := gormDB.DB()
	if err != nil {
		log.Fatal("Error getting sql.DB:", err)
	}
	defer sqlDB.Close()

	if err := goosepkg.Run(sqlDB, command); err != nil {
		log.Fatal(err)
	}
}
