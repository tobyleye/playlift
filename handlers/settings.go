package handlers

import (
	"fmt"
	"log"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/tobyleye/playlift/models"
	"github.com/tobyleye/playlift/session"
	"gorm.io/gorm"
)

func (h *Handlers) DeactivateAccount(c echo.Context) error {
	user, _ := session.GetUserFromSession(c)

	err := h.Db.Transaction(func(tx *gorm.DB) error {
		// Delete user playlists

		if err := tx.Model(&models.User{}).Where("user_id = ?", user.UserId).Updates(models.User{
			Active: false,
			Email:  fmt.Sprintf("%s-deactivated-%d", user.Email, time.Now().UnixMilli()),
		}).Error; err != nil {
			log.Println("error deactivating user account", err)
			return err
		}

		// Delete  tokens
		if err := tx.Where("user_id = ?", user.UserId).Delete(&models.Token{}).Error; err != nil {
			log.Println("error deactivating user account", err)
			return err
		}

		return nil
	})

	if err != nil {
		log.Println("error deactivating user account", err)
		return c.JSON(500, errorResponse("internal server error"))
	}

	session.ClearSession(c)
	return c.JSON(200, struct{}{})
}
