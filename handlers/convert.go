package handlers

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/session"
	"github.com/tobyleye/playlift/tasks"
)

type PlaylistDetails struct {
	Title       string `json:"title"`
	Link        string `json:"link"`
	TotalTracks int    `json:"total_tracks"`
}

type AllPlaylistDetails map[string]PlaylistDetails

var LIKED_PLAYLIST_ID = "LM" // Liked music playlist ID is always "LM"

func (h Handlers) Convert(c echo.Context) error {

	var body struct {
		Destination string `json:"destination"`
		Source      string `json:"source"`
		Watch       bool   `json:"watch"` // Enable auto-sync for these playlists
		Playlists   []struct {
			ID    string `json:"id"`
			Title string `json:"title"`
			Watch bool   `json:"watch"`
		} `json:"playlists"`
	}

	requestBodyToStruct(c, &body)

	for _, playlist := range body.Playlists {
		if playlist.ID == "" || playlist.Title == "" {
			return c.JSON(http.StatusBadRequest, errorResponse("playlist id and title are required"))
		}
	}

	user, _ := session.GetUserFromSession(c)

	destinationPlatform := strings.ToLower(body.Destination)
	sourcePlatform := strings.ToLower(body.Source)

	// validate destination platform
	if !isPlatformSupported(destinationPlatform) ||
		!isPlatformSupported(sourcePlatform) {

		return c.JSON(400, errorResponse("invalid platform"))
	}

	var conversions = []*models.PlaylistConversion{}
	var watches = []*models.ConversionWatch{}
	var newConversions = []*models.PlaylistConversion{}
	var newWatches = []*models.ConversionWatch{}

	for _, playlist := range body.Playlists {

		// Check for an existing conversion for the same playlist
		var existing models.PlaylistConversion
		err := h.Db.Where(
			"user_id = ? AND playlist_id = ? AND source_platform = ? AND destination_platform = ?",
			user.UserId, playlist.ID, sourcePlatform, destinationPlatform,
		).First(&existing).Error

		if err == nil && existing.ConversionID != "" {
			// Existing conversion found — reset status and reuse it
			existing.Status = "pending"
			existing.PlaylistTitle = playlist.Title
			existing.EnableWatch = playlist.Watch
			if err := h.Db.Save(&existing).Error; err != nil {
				log.Println("error updating existing conversion: ", err)
				return c.JSON(500, errorResponse("internal server error"))
			}
			conversions = append(conversions, &existing)
		} else {
			// No existing conversion — create a new one
			conversion := models.PlaylistConversion{
				UserId:              user.UserId,
				PlaylistId:          playlist.ID,
				PlaylistTitle:       playlist.Title,
				ConversionID:        uuid.New().String(),
				TotalTracks:         -1,
				SourcePlatform:      sourcePlatform,
				DestinationPlatform: destinationPlatform,
				Status:              "pending",
				CreatedPlaylistId:   "",
				CreatedAt:           time.Now(),
				EnableWatch:         playlist.Watch,
			}
			newConversions = append(newConversions, &conversion)
			conversions = append(conversions, &conversion)

			if playlist.Watch {
				val := models.ConversionWatch{
					WatchID:      uuid.New().String(),
					UserId:       user.UserId,
					ConversionId: conversion.ConversionID,
					CreatedAt:    time.Now(),
				}
				newWatches = append(newWatches, &val)
				watches = append(watches, &val)
			}
		}
	}

	// Create only new conversions in the database
	if len(newConversions) > 0 {
		if err := h.Db.Create(&newConversions).Error; err != nil {
			log.Println("error creating conversions: ", err)
			return c.JSON(500, errorResponse("internal server error"))
		}
	}

	if len(newWatches) > 0 {
		if err := h.Db.Create(&newWatches).Error; err != nil {
			log.Println("error creating conversion watches: ", err)
		}
	}

	for _, conversion := range conversions {
		task := tasks.NewPlaylistConversionTask(conversion.ConversionID)
		taskInfo, err := h.AsynqClient.Enqueue(task)
		if err != nil {
			log.Println("error enqueing conversion task..", err)
		} else {
			log.Println("enqueued conversion task: ", taskInfo)
		}
	}

	// // start a goroutine to handle the conversion
	// go startConversions(h.Db, h.Cache, conversions...)

	// conversionIds := []string{}
	// for _, conversion := range conversions {
	// 	conversionIds = append(conversionIds, conversion.ConversionID)
	// }

	// conversionIds := []string{"hey", "bye"}

	return c.JSON(200, map[string]interface{}{"data": conversions, "watches": watches})
}
