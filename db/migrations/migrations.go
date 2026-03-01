package migrations

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/pressly/goose/v3"
)

// Run executes a goose command (up, down, status, etc.) against the database.
func Run(db *sql.DB, command string) error {
	if err := goose.SetDialect("mysql"); err != nil {
		return fmt.Errorf("failed to set dialect: %w", err)
	}

	// Log current version
	current, err := goose.GetDBVersion(db)
	if err != nil {
		return fmt.Errorf("failed to get current migration version: %w", err)
	}
	log.Printf("Current migration version: %d", current)

	// "." because migrations are registered via init(), no filesystem dir needed
	if err := goose.Run(command, db, "."); err != nil {
		return fmt.Errorf("goose %s failed: %w", command, err)
	}

	log.Printf("Migration command '%s' completed ✅", command)
	return nil
}
