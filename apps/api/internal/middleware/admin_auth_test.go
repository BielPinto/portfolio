package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestAdminAPIKey_rejectsWhenExpectedEmpty(t *testing.T) {
	t.Parallel()
	r := gin.New()
	r.Use(AdminAPIKey(""))
	r.GET("/admin", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	req.Header.Set("X-Admin-Key", "any")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", w.Code)
	}
}

func TestAdminAPIKey_acceptsXAdminKey(t *testing.T) {
	t.Parallel()
	r := gin.New()
	r.Use(AdminAPIKey("secret-key"))
	r.GET("/admin", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	req.Header.Set("X-Admin-Key", "secret-key")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
}

func TestAdminAPIKey_acceptsBearerToken(t *testing.T) {
	t.Parallel()
	r := gin.New()
	r.Use(AdminAPIKey("secret-key"))
	r.GET("/admin", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	req.Header.Set("Authorization", "Bearer secret-key")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
}

func TestAdminAPIKey_rejectsWrongKey(t *testing.T) {
	t.Parallel()
	r := gin.New()
	r.Use(AdminAPIKey("secret-key"))
	r.GET("/admin", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	req.Header.Set("X-Admin-Key", "wrong")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", w.Code)
	}
}

func TestAdminAPIKey_rejectsMissingCredentials(t *testing.T) {
	t.Parallel()
	r := gin.New()
	r.Use(AdminAPIKey("secret-key"))
	r.GET("/admin", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", w.Code)
	}
}
