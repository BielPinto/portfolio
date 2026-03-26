package middleware

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	limitgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// NewRateLimiter builds in-memory per-IP rate limiting middleware.
// formatted uses ulule/limiter syntax (e.g. "100-M"). Returns (nil, nil) if disabled.
func NewRateLimiter(formatted string, log *slog.Logger) (gin.HandlerFunc, error) {
	s := strings.TrimSpace(formatted)
	if s == "" {
		return nil, nil
	}
	switch strings.ToLower(s) {
	case "0", "off", "false":
		return nil, nil
	}
	rate, err := limiter.NewRateFromFormatted(s)
	if err != nil {
		return nil, err
	}

	store := memory.NewStore()
	lim := limiter.New(store, rate)
	inner := limitgin.NewMiddleware(lim,
		limitgin.WithErrorHandler(func(c *gin.Context, err error) {
			log.Error("rate limiter store error",
				"error", err,
				"request_id", c.GetString(ContextRequestID),
			)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "internal_error",
				"message": "something went wrong",
			})
		}),
		limitgin.WithLimitReachedHandler(func(c *gin.Context) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "rate_limit_exceeded",
				"message": "too many requests",
			})
		}),
	)
	return skipGETHealth(inner), nil
}

// skipGETHealth avoids counting load-balancer / probe traffic against contact limits.
func skipGETHealth(next gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet && strings.HasSuffix(c.Request.URL.Path, "/health") {
			c.Next()
			return
		}
		next(c)
	}
}
