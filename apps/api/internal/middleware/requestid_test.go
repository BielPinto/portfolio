package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestRequestID_generatesWhenMissing(t *testing.T) {
	t.Parallel()
	r := gin.New()
	r.Use(RequestID())
	r.GET("/", func(c *gin.Context) {
		id, ok := c.Get(ContextRequestID)
		if !ok || id == "" {
			t.Fatal("expected request id in context")
		}
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
	if w.Header().Get(HeaderRequestID) == "" {
		t.Fatal("expected X-Request-ID response header")
	}
}

func TestRequestID_reusesIncomingHeader(t *testing.T) {
	t.Parallel()
	const custom = "abc-123-def"
	r := gin.New()
	r.Use(RequestID())
	r.GET("/", func(c *gin.Context) {
		id, _ := c.Get(ContextRequestID)
		if id != custom {
			t.Fatalf("context id %v want %s", id, custom)
		}
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set(HeaderRequestID, custom)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if got := w.Header().Get(HeaderRequestID); got != custom {
		t.Fatalf("header %q want %q", got, custom)
	}
}
