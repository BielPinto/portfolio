package main

import (
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v5/stdlib" // register pgx driver for database/sql

	"portifolio_backend/config"
	"portifolio_backend/pkg/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	log := logger.New(slog.LevelInfo)
	_ = gin.New()
	log.Info("portifolio_backend api initialized", "port", cfg.Port)
}
