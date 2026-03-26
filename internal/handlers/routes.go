package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PublicRouterDeps groups dependencies for public HTTP routes.
type PublicRouterDeps struct {
	Pool      *pgxpool.Pool
	Version   string
	Contacts  *ContactHandler
	APIPrefix string
}

// RegisterPublicRoutes mounts public routes on r (e.g. health and POST /contact).
func RegisterPublicRoutes(r *gin.Engine, d PublicRouterDeps) {
	prefix := d.APIPrefix
	if prefix == "" {
		prefix = "/api/v1"
	}

	health := NewHealthHandler(d.Pool, d.Version)
	r.GET("/health", health.Get)
	r.POST("/contact", d.Contacts.SubmitContact)

	v1 := r.Group(prefix)
	{
		v1.GET("/health", health.Get)
		v1.POST("/contact", d.Contacts.SubmitContact)
	}
}
