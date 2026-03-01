package handlers

import (
	"log"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/session"
)

func (h Handlers) RestartConversion(c echo.Context) error {
	// user, _ := session.GetUserFromSession(c)
	conversionId := c.Param("id")
	var conversion models.PlaylistConversion

	h.Db.First(&conversion, "id = ?", conversionId)
	if conversion.ConversionID == "" {
		return c.JSON(404, struct{}{})
	}
	if conversion.Status == "pending" {
		return c.JSON(400, errorResponse("cannot restart a pending conversion"))
	}
	conversion.Status = "pending"

	h.Db.Save(&conversion)

	return c.JSON(200, struct{}{})
}

func (h Handlers) GetSingleConversion(c echo.Context) error {
	user, _ := session.GetUserFromSession(c)
	conversionId := c.Param("id")

	var conversion = models.PlaylistConversion{}

	h.Db.Where(models.PlaylistConversion{
		UserId:       user.UserId,
		ConversionID: conversionId,
	}).First(&conversion)

	if conversion.ConversionID == "" {
		return c.JSON(404, struct{}{})
	}

	return c.JSON(200, conversion)
}

func (h Handlers) DeleteConversion(c echo.Context) error {
	conversionId := c.Param("id")
	var conversion models.PlaylistConversion
	h.Db.First(&conversion, "id = ?", conversionId)
	if conversion.ConversionID == "" {
		return c.JSON(404, struct{}{})
	}
	h.Db.Delete(&conversion)
	return c.JSON(200, struct{}{})
}

func (h Handlers) GetAllConversions(c echo.Context) error {

	user, _ := session.GetUserFromSession(c)
	type ConversionResponse struct {
		ConversionID        string    `json:"conversion_id"`
		PlaylistTitle       string    `json:"playlist_title"`
		PlaylistLink        string    `json:"playlist_link"`
		PlaylistId          string    `json:"playlist_id"`
		DestinationPlatform string    `json:"destination_platform"`
		SourcePlatform      string    `json:"source_platform"`
		Status              string    `json:"status"`
		EnableWatch         bool      `json:"enable_watch"`
		TotalTracks         int       `json:"total_tracks"`
		CreatedAt           time.Time `json:"created_at"`
	}

	var conversions []ConversionResponse

	queryResult := h.Db.Model(&models.PlaylistConversion{}).Where(&models.PlaylistConversion{
		UserId: user.UserId,
	}).Order("created_at DESC").Find(&conversions)

	if queryResult.Error != nil {
		log.Println("get all conversion error:", queryResult.Error)
	}
	return c.JSON(200, conversions)
}
