//go:build integration

package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"portifolio_backend/internal/handlers"
	"portifolio_backend/internal/models"
	"portifolio_backend/internal/ports"
	"portifolio_backend/internal/repositories"
	"portifolio_backend/internal/services"
)

func discardLog() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func newIntegrationRouter() *gin.Engine {
	repo := repositories.NewContactRepository(testPool)
	svc := services.NewContactService(repo, ports.NoOpEventPublisher{}, discardLog())
	contactH := handlers.NewContactHandler(svc)
	r := gin.New()
	handlers.RegisterRoutes(r, handlers.RouterDeps{
		Pool:        testPool,
		Version:     "integration",
		Contacts:    contactH,
		AdminAPIKey: "integration-secret",
	})
	return r
}

func TestIntegration_health_rootAndV1(t *testing.T) {
	r := newIntegrationRouter()

	for _, path := range []string{"/health", "/api/v1/public/health"} {
		t.Run(path, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodGet, path, nil)
			r.ServeHTTP(w, req)
			if w.Code != http.StatusOK {
				t.Fatalf("%s: status %d %s", path, w.Code, w.Body.String())
			}
			var hr handlers.HealthResponse
			if err := json.Unmarshal(w.Body.Bytes(), &hr); err != nil {
				t.Fatal(err)
			}
			if hr.Status != "ok" || hr.Database != "ok" {
				t.Fatalf("response %+v", hr)
			}
		})
	}
}

func TestIntegration_contact_post_persistsRow(t *testing.T) {
	r := newIntegrationRouter()
	email := "integration-" + uuid.NewString() + "@example.com"
	payload, err := json.Marshal(map[string]string{
		"name":    "Integration User",
		"email":   email,
		"message": "hello from integration test",
	})
	if err != nil {
		t.Fatal(err)
	}

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/contact", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("status %d %s", w.Code, w.Body.String())
	}
	var resp models.SubmitContactResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp.ID == uuid.Nil {
		t.Fatal("missing id")
	}

	var count int
	err = testPool.QueryRow(context.Background(),
		`SELECT COUNT(*) FROM contacts WHERE id = $1 AND email = $2`, resp.ID, email,
	).Scan(&count)
	if err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("want 1 row, got %d", count)
	}
}

func TestIntegration_contact_post_versionedPath(t *testing.T) {
	r := newIntegrationRouter()
	email := "v1-" + uuid.NewString() + "@example.com"
	body := `{"name":"V","email":"` + email + `","message":"m"}`
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/public/contact", bytes.NewReader([]byte(body)))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("status %d %s", w.Code, w.Body.String())
	}
}

func TestIntegration_admin_requiresKey(t *testing.T) {
	r := newIntegrationRouter()

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin/status", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("want 401 without key, got %d", w.Code)
	}

	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/admin/status", nil)
	req2.Header.Set("X-Admin-Key", "integration-secret")
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("want 200 with key, got %d %s", w2.Code, w2.Body.String())
	}
}
