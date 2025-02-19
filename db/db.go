package db

import (
	"fmt"
	"os"

	"github.com/go-sql-driver/mysql"

	_ "github.com/joho/godotenv/autoload"
	gormMysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func OpenDb() (*gorm.DB, error) {

	dbConfig := mysql.Config{
		User:                 os.Getenv("DB_USER"),
		Passwd:               os.Getenv("DB_PASSWORD"),
		DBName:               os.Getenv("DB_NAME"),
		Net:                  "tcp",
		Addr:                 fmt.Sprintf("%s:%s", os.Getenv("DB_HOST"), os.Getenv("DB_PORT")),
		AllowNativePasswords: true,
		ParseTime:            true,
	}
	dbConnUrl := dbConfig.FormatDSN()
	db, err := gorm.Open(gormMysql.Open(dbConnUrl))
	return db, err
}
