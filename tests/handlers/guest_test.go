package test_handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/tobyleye/playlift/handlers"
	"github.com/tobyleye/playlift/server"
)

func Test_GuestHelloHandler(t *testing.T) {
	t.Log("testing guest cookie initialization")

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/guest/hellee", nil)
	e := echo.New()
	ctx := e.NewContext(req, rec)
	handlers.TestHandler(ctx)

	assert.Equal(t, http.StatusOK, rec.Code, "code should match")

	d := json.NewDecoder(rec.Body)

	var response map[string]interface{}
	err := d.Decode(&response)

	if err != nil {
		t.Error("response structure doesn't match")
	}

	assert.Equal(t, "hello world", response["message"], "message is not what is expected")

}

func Test_GuestCookieInit(t *testing.T) {
	t.Log("testing cookie init for guests")

	cookieStore := sessions.NewCookieStore()

	server := server.NewServer(
		handlers.Handlers{
			Db:           nil,
			SessionStore: cookieStore,
			// SpotifyClient: nil,
			// Context:       nil,
			// YoutubeClient: nil,
			// Cache:         nil,
			// AsynqClient:   nil,
		},

		cookieStore,
	)

	// build req
	res := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/guest/hello", nil)

	server.ServeHTTP(res, req)

	d := json.NewDecoder(res.Body)
	var response map[string]interface{}

	if err := d.Decode(&response); err != nil {
		t.Error("invalid response", err)
	}

	assert.Equal(t, "hello world", response["message"], "message is not what is expected")

}
