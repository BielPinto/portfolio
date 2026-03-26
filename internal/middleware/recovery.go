package middleware

import (
	"io"
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// Recovery returns a Gin middleware that recovers panics, logs with slog (including stack), and responds with JSON 500.
func Recovery(log *slog.Logger) gin.HandlerFunc {
	return gin.CustomRecoveryWithWriter(io.Discard, func(c *gin.Context, err any) {
		log.Error("panic recovered",
			"request_id", c.GetString(ContextRequestID),
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"panic", err,
			"stack", string(debug.Stack()),
		)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"error":   "internal_error",
			"message": "something went wrong",
		})
	})
}
