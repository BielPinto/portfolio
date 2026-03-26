// Package main runs the portfolio HTTP API.
//
// @title                       Portfolio API
// @version                     0.1.0
// @description                 HTTP API for portfolio health checks and contact form submissions.
// @host                        localhost:8080
// @BasePath                    /
// @schemes                     http https
//
//go:generate go run github.com/swaggo/swag/cmd/swag@latest init -g main.go -o docs -d .,../../internal/handlers,../../internal/models
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	docs "portifolio_backend/cmd/api/docs"
	"portifolio_backend/config"
	"portifolio_backend/internal/db"
	"portifolio_backend/internal/handlers"
	"portifolio_backend/internal/middleware"
	"portifolio_backend/internal/repositories"
	"portifolio_backend/internal/services"
	"portifolio_backend/pkg/logger"
)

const apiVersion = "0.1.0"

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	log := logger.New(cfg.LogLevel)
	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	mctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	if err := db.Migrate(mctx, pool); err != nil {
		log.Error("migrations failed", "error", err)
		os.Exit(1)
	}

	contactRepo := repositories.NewContactRepository(pool)
	contactSvc := services.NewContactService(contactRepo)
	contactH := handlers.NewContactHandler(contactSvc)

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery(log))
	r.Use(middleware.RequestLogger(log))
	rateMW, err := middleware.NewRateLimiter(cfg.RateLimit, log)
	if err != nil {
		log.Error("invalid RATE_LIMIT", "error", err)
		os.Exit(1)
	}
	if rateMW != nil {
		r.Use(rateMW)
	}

	docs.SwaggerInfo.Host = "localhost:" + cfg.Port
	docs.SwaggerInfo.Version = apiVersion

	handlers.RegisterPublicRoutes(r, handlers.PublicRouterDeps{
		Pool:     pool,
		Version:  apiVersion,
		Contacts: contactH,
	})

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	addr := ":" + cfg.Port
	srv := &http.Server{
		Addr:              addr,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Info("listening", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("graceful shutdown failed", "error", err)
	}
	log.Info("server stopped")
}
