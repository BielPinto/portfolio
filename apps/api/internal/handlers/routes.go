package handlers

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"portifolio_backend/internal/middleware"
)

// RouterDeps groups dependencies for HTTP route registration.
type RouterDeps struct {
	Pool        *pgxpool.Pool
	Version     string
	Contacts    *ContactHandler
	APIPrefix   string
	AdminAPIKey string
}

// RegisterRoutes mounts root and versioned routes: /health, /contact, /api/v1/public/*, and optional /api/v1/admin.
func RegisterRoutes(r *gin.Engine, d RouterDeps) {
	prefix := d.APIPrefix
	if prefix == "" {
		prefix = "/api/v1"
	}

	health := NewHealthHandler(d.Pool, d.Version)

	r.GET("/health", health.Get)
	r.POST("/contact", d.Contacts.SubmitContact)

	api := r.Group(prefix)
	public := api.Group("/public")
	{
		public.GET("/health", health.Get)
		public.POST("/contact", d.Contacts.SubmitContact)
	}

	if key := strings.TrimSpace(d.AdminAPIKey); key != "" {
		admin := api.Group("/admin", middleware.AdminAPIKey(key))
		admin.GET("/status", adminStatus)
	}
}

func adminStatus(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
}
