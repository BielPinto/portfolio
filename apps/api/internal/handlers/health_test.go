package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHealthHandler_Get_noPool(t *testing.T) {
	t.Parallel()
	h := NewHealthHandler(nil, "1.2.3")
	r := gin.New()
	r.GET("/health", h.Get)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status %d", w.Code)
	}
	body := w.Body.String()
	if !strings.Contains(body, `"status":"ok"`) || !strings.Contains(body, `"version":"1.2.3"`) {
		t.Fatalf("body %s", body)
	}
}
