package models

import (
	"log"

	"gorm.io/gorm"
)

func CreateOrUpdateTokenForUser(db *gorm.DB, userId string, token *Token) error {
	updateResult := db.Where(&Token{
		UserId:   userId,
		Platform: token.Platform,
	}).Updates(token)

	if updateResult.Error != nil {
		return updateResult.Error
	}

	if updateResult.RowsAffected == 0 {
		return db.Create(token).Error
	} else {
		log.Println("user token updated")
	}

	return nil
}
