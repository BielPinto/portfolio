package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// HealthResponse is the JSON body for GET /health.
type HealthResponse struct {
	Status   string `json:"status"`
	Version  string `json:"version"`
	Database string `json:"database,omitempty"`
}

// HealthHandler serves health checks with optional DB ping.
type HealthHandler struct {
	pool    *pgxpool.Pool
	version string
}

// NewHealthHandler constructs a HealthHandler.
func NewHealthHandler(pool *pgxpool.Pool, version string) *HealthHandler {
	return &HealthHandler{pool: pool, version: version}
}

// Get handles GET /health (and GET /api/v1/health).
//
// @Summary      Health check
// @Description  Returns service status and optional database connectivity.
// @Tags         health
// @Produce      json
// @Success      200 {object} HealthResponse "OK"
// @Failure      503 {object} HealthResponse "Database unavailable"
// @Router       /health [get]
// @Router       /api/v1/health [get]
func (h *HealthHandler) Get(c *gin.Context) {
	if h.pool == nil {
		respondJSON(c, http.StatusOK, HealthResponse{Status: "ok", Version: h.version})
		return
	}
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()
	if err := h.pool.Ping(ctx); err != nil {
		respondJSON(c, http.StatusServiceUnavailable, HealthResponse{
			Status:   "unhealthy",
			Database: "down",
			Version:  h.version,
		})
		return
	}
	respondJSON(c, http.StatusOK, HealthResponse{
		Status:   "ok",
		Database: "ok",
		Version:  h.version,
	})
}
