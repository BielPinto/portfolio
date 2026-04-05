package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AdminAPIKey enforces admin routes using X-Admin-Key or Authorization: Bearer <key>.
func AdminAPIKey(expected string) gin.HandlerFunc {
	expected = strings.TrimSpace(expected)
	expectedBytes := []byte(expected)
	return func(c *gin.Context) {
		if len(expectedBytes) == 0 {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		var got string
		if h := strings.TrimSpace(c.GetHeader("X-Admin-Key")); h != "" {
			got = h
		} else if ah := strings.TrimSpace(c.GetHeader("Authorization")); len(ah) >= 7 && strings.EqualFold(ah[:7], "Bearer ") {
			got = strings.TrimSpace(ah[7:])
		}
		if len(got) == 0 || subtle.ConstantTimeCompare([]byte(got), expectedBytes) != 1 {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		c.Next()
	}
}
