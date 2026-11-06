package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/sessions"
	echoSessionMiddleware "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/session"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupTestDB creates an in-memory database for testing
func SetupTestDB(t *testing.T) *gorm.DB {
	// Use an in-memory SQLite database for testing
	// Note: You may need to add "gorm.io/driver/sqlite" to go.mod
	// For now, using MySQL DSN that points to a test database
	// In production tests, you'd use sqlmock or testcontainers

	db, err := gorm.Open(mysql.Open("test:test@tcp(127.0.0.1:3306)/playlift_test?charset=utf8mb4&parseTime=True&loc=Local"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})

	if err != nil {
		t.Skip("Skipping test: database connection failed. Set up test database or use mock.")
	}

	// Auto-migrate the schema
	err = db.AutoMigrate(&models.PlaylistConversion{}, &models.User{})
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

// setupTestContext creates a test Echo context with session
func SetupTestContext(userID string) (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()

	// Create session middleware
	store := sessions.NewCookieStore([]byte("test-secret-key"))
	e.Use(echoSessionMiddleware.Middleware(store))

	req := httptest.NewRequest(http.MethodGet, "/api/conversions", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Set up session with user data
	sess, _ := echoSessionMiddleware.Get(session.SESSION_NAME, c)
	sess.Values["user_id"] = userID
	sess.Save(req, rec)

	return c, rec
}
