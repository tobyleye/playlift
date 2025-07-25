package db

import (
	"fmt"

	"github.com/go-sql-driver/mysql"
	"github.com/tobyleye/playlift/config"

	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func OpenDb() (*gorm.DB, error) {

	dbConfig := mysql.Config{
		User:                 config.DB_USER,
		Passwd:               config.DB_PASSWORD,
		DBName:               config.DB_NAME,
		Net:                  "tcp",
		Addr:                 fmt.Sprintf("%s:%s", config.DB_HOST, config.DB_PORT),
		AllowNativePasswords: true,
		ParseTime:            true,
		ConnectionAttributes: "charset:utf8mb4",
	}
	dbConnUrl := dbConfig.FormatDSN()
	db, err := gorm.Open(gormMysql.Open(dbConnUrl))
	return db, err
}
