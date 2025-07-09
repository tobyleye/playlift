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
	// If no rows were affected, create a new token
	if updateResult.RowsAffected == 0 {
		return db.Create(token).Error
	} else {
		log.Println("user token updated")
	}

	return nil
}

type UserTokens struct {
	Youtube *Token
	Spotify *Token
}

func GetUserTokens(db *gorm.DB, userId string) (UserTokens, error) {
	tokens := []Token{}
	result := db.Where("user_id = ?", userId).Find(&tokens)
	if result.Error != nil {
		return UserTokens{}, result.Error
	}
	var userTokens UserTokens

	for _, token := range tokens {
		log.Printf("token: %#v\n", tokens)
		if token.Platform == "youtube" {
			userTokens.Youtube = &token
		} else if token.Platform == "spotify" {
			userTokens.Spotify = &token
		}
	}

	return userTokens, nil
}
