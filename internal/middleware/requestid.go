package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	// HeaderRequestID is the HTTP header used for correlation.
	HeaderRequestID = "X-Request-ID"
	// ContextRequestID is the Gin context key for the request ID (also used in logs).
	ContextRequestID = "request_id"
)

// RequestID ensures every request has an ID: reuses X-Request-ID when present, otherwise generates one.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader(HeaderRequestID)
		if id == "" {
			id = uuid.New().String()
		}
		c.Writer.Header().Set(HeaderRequestID, id)
		c.Set(ContextRequestID, id)
		c.Next()
	}
}
