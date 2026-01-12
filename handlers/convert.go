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

	for _, playlist := range body.Playlists {

		conversion := models.PlaylistConversion{
			UserId:              user.UserId,
			PlaylistId:          playlist.ID,
			PlaylistTitle:       playlist.Title,
			ConversionID:        uuid.New().String(),
			TotalTracks:         -1,
			SourcePlatform:      sourcePlatform,
			DestinationPlatform: destinationPlatform,
			Status:              "pending",
			CreatedAt:           time.Now(),
			EnableWatch:         playlist.Watch,
		}

		conversions = append(conversions, &conversion)

		if playlist.Watch == true {
			val := models.ConversionWatch{
				WatchID:      uuid.New().String(),
				UserId:       user.UserId,
				ConversionId: conversion.ConversionID,
				CreatedAt:    time.Now(),
			}
			watches = append(watches, &val)
		}

	}

	// h.Db.Transaction()

	// create conversions in the database
	if err := h.Db.Create(&conversions).Error; err != nil {
		log.Println("error creating conversions: ", err)
		return c.JSON(500, errorResponse("internal server error"))
	}

	if len(watches) > 0 {
		if err := h.Db.Create(&watches).Error; err != nil {
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
