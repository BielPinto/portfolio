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

	_ "github.com/joho/godotenv/autoload"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	docs "github.com/BielPinto/portfolio/apps/api/cmd/api/docs"
	"github.com/BielPinto/portfolio/apps/api/config"
	"github.com/BielPinto/portfolio/apps/api/internal/db"
	"github.com/BielPinto/portfolio/apps/api/internal/handlers"
	"github.com/BielPinto/portfolio/apps/api/internal/middleware"
	"github.com/BielPinto/portfolio/apps/api/internal/ports"
	"github.com/BielPinto/portfolio/apps/api/internal/repositories"
	"github.com/BielPinto/portfolio/apps/api/internal/services"
	"github.com/BielPinto/portfolio/apps/api/pkg/logger"
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
	publisher := ports.NoOpEventPublisher{}
	contactSvc := services.NewContactService(contactRepo, publisher, log)
	contactH := handlers.NewContactHandler(contactSvc)

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(middleware.RequestID())
	r.Use(middleware.Recovery(log))
	corsCfg := cors.Config{
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: false,
	}
	if len(cfg.CorsOrigins) > 0 {
		corsCfg.AllowOrigins = cfg.CorsOrigins
	} else {
		corsCfg.AllowAllOrigins = true
	}
	r.Use(cors.New(corsCfg))
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

	handlers.RegisterRoutes(r, handlers.RouterDeps{
		Pool:        pool,
		Version:     apiVersion,
		Contacts:    contactH,
		AdminAPIKey: cfg.AdminAPIKey,
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
