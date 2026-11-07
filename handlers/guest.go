package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	echoSessionMiddleware "github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/formatters"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/tasks"
)

func (h *Handlers) LoadPlaylist(c echo.Context) error {

	playlistUrl := c.QueryParam("playlist_url")

	conversionLink, err := ParseConversionLink(playlistUrl)

	if err != nil {
		log.Println("error parsing conversion playlist link", err)
		return c.JSON(400, map[string]interface{}{"message": "bad request"})
	}

	previewPlaylist := func(link ConversionLink, h *Handlers) (formatters.PlaylistPreview, interface{}, error) {
		if conversionLink.Platform == YOUTUBE_MUSIC {

			playlist, err := h.PublicYTMusicClient.GetPlaylistById(conversionLink.ID)
			if err != nil {
				return formatters.PlaylistPreview{}, nil, err
			}
			return formatters.FormatYoutubeMusicPlaylistForPreview(playlist), playlist, err

		} else if conversionLink.Platform == SPOTIFY {
			playlist, err := h.AppSpotifyClient.GetPlaylist(conversionLink.ID)

			if err != nil {
				return formatters.PlaylistPreview{}, nil, err
			}

			formattedPlaylist := formatters.FormatSpotifyPlaylistForPreview(playlist)
			return formattedPlaylist, playlist, nil

		} else {
			return formatters.PlaylistPreview{}, nil, fmt.Errorf("just an error ")

		}
	}

	playlist, unparsedPlaylist, err := previewPlaylist(conversionLink, h)

	if err != nil {
		log.Println("error fetching playlist", err)
		return c.JSON(500, map[string]interface{}{"error": err})
	}

	return c.JSON(200, map[string]interface{}{"playlist": playlist, "link": conversionLink, "raw": unparsedPlaylist})

}

func (h *Handlers) ConvertPlaylist(c echo.Context) error {
	var body struct {
		PlaylistLink        string `json:"playlist_link"`
		PlaylistTitle       string `json:"playlist_title"`
		DestinationPlatform string `json:"destination_platform"`
	}

	err := requestBodyToStruct(c, &body)

	if err != nil {
		log.Println("error pasing request body", err)
		return c.JSON(http.StatusInternalServerError, struct{}{})
	}

	link, err := ParseConversionLink(body.PlaylistLink)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"message": "link is not valid"})
	}

	if link.Platform == body.DestinationPlatform {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"message": "destination cannot be the same as the source"})
	}

	// create conversion here and then send it to queue with an higher priority
	// guest conversions are treated with a higher priority  so that they can quickly be processed

	// after creating the conversions, we also add the conversion ids to the user session - that is the only way we are
	// able to get them if they decide to login and finish the conversion.

	// create conversion
	conversion := models.PlaylistConversion{
		UserId:              "",
		PlaylistId:          link.ID,
		PlaylistTitle:       body.PlaylistTitle,
		ConversionID:        uuid.New().String(),
		TotalTracks:         -1,
		SourcePlatform:      link.Platform,
		DestinationPlatform: body.DestinationPlatform,
		Status:              "pending",
		CreatedPlaylistId:   "",
		CreatedAt:           time.Now(),
		EnableWatch:         false,
	}

	if err := h.Db.Create(&conversion); err.Error != nil {
		log.Println("error saving data...", err)
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"message": "internal server error"})
	}

	_, err = tasks.EnqueuePlaylistConversionTask(h.AsynqClient, conversion.ConversionID, true)

	if err != nil {
		log.Println("failed to create conversion task", err)
		return c.JSON(500, map[string]interface{}{"message": "server error"})
	}

	return c.JSON(200, map[string]interface{}{"success": true, "conversion": conversion})
}

func (h *Handlers) PlaylistPreviewMiddleware(next echo.HandlerFunc) echo.HandlerFunc {

	return func(c echo.Context) error {
		previewedPlaylists, _ := echoSessionMiddleware.Get("previewed_playlist", c)

		fmt.Println("previewdplaylist cookie value...", previewedPlaylists.Values["value"])

		var totalAttempt = 3

		if previewedPlaylists.Values["value"] != nil {
			totalAttempt, _ = previewedPlaylists.Values["value"].(int)
		}

		if totalAttempt <= 0 {
			return c.JSON(400, map[string]string{"message": "sorry. u have exhausted ur preview attempt"})
		}

		return next(c)
	}

}

func (h *Handlers) ViewConversionStatus(c echo.Context) error {
	conversionId := c.Param("conversionId")
	fmt.Println("conversion id...", conversionId)

	conversion := models.PlaylistConversion{
		ConversionID: conversionId,
	}

	if err := h.Db.First(&conversion).Error; err != nil {
		log.Println("error getting conversion..", err)
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{})
	}
	key := fmt.Sprintf("conversion:%s", "0779c4cb-6a7b-439c-a29a-aca4a1815b50")

	cmd := h.Cache.B().Get().Key(key).Build()

	res := h.Cache.Do(context.TODO(), cmd)

	if err := res.Error(); err != nil {
		log.Println("error getting conversion state..", err)
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{})
	}

	conversionState, err := res.AsBytes()
	var val map[string]interface{}
	if err != nil {
		fmt.Println("res map..", err)
	} else {
		json.Unmarshal(conversionState, &val)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{"conversion": conversion, "state": val})

}

func decrementPreviewCredit(c echo.Context, newValue int) error {
	previewedPlaylists, err := echoSessionMiddleware.Get("previewed_playlist", c)

	if err != nil {
		return err
	}
	fmt.Println("previewdplaylist cookie value...", previewedPlaylists.Values["value"])

	fmt.Println("previewdplaylist cookie value...", previewedPlaylists.Values["value"])

	var totalAttempt = 3

	if previewedPlaylists.Values["value"] != nil {
		totalAttempt, _ = previewedPlaylists.Values["value"].(int)
	}

	totalAttempt -= 1
	previewedPlaylists.Values["value"] = int(math.Max(float64(totalAttempt), 0))

	err = previewedPlaylists.Save(c.Request(), c.Response())

	return err
}

func (h *Handlers) InitGuestSessionMiddleware(next echo.HandlerFunc) echo.HandlerFunc {

	return func(c echo.Context) error {
		sess, err := echoSessionMiddleware.Get("guest", c)

		if err != nil {
			// try to create a new session
			log.Println("error getting session 'guest'", err)
			// return nil
			next(c)
			return nil
		}

		log.Println("successfully retrieved 'guest' session ", sess)

		// created once and doesn't expire
		sess.Options = &sessions.Options{
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
		}

		sess.Values = map[interface{}]interface{}{
			"conversions_done": 0,
		}

		err = sess.Save(c.Request(), c.Response())
		if err != nil {
			log.Println("error saving guest session", err)
		}
		next(c)

		return nil
	}
}

func (h *Handlers) GetGuestConversions(c echo.Context) error {
	var conversions []models.PlaylistConversion

	if err := h.Db.Where(&models.PlaylistConversion{UserId: ""}).Find(&conversions).Error; err != nil {
		log.Println("error getting guest conversions")
		return c.JSON(http.StatusInternalServerError, struct{}{})
	}

	return c.JSON(http.StatusOK, conversions)
}

func TestHandler(c echo.Context) error {
	fmt.Println("[TestHandler] foobar")
	return c.JSON(200, map[string]interface{}{"message": "hello world"})
}
