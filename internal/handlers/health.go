package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Health returns a handler for GET /health with optional database check.
func Health(pool *pgxpool.Pool, version string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if pool == nil {
			respondJSON(c, http.StatusOK, gin.H{"status": "ok", "version": version})
			return
		}
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := pool.Ping(ctx); err != nil {
			respondJSON(c, http.StatusServiceUnavailable, gin.H{
				"status":   "unhealthy",
				"database": "down",
				"version":  version,
			})
			return
		}
		respondJSON(c, http.StatusOK, gin.H{
			"status":   "ok",
			"database": "ok",
			"version":  version,
		})
	}
}
