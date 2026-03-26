package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"portifolio_backend/internal/models"
	"portifolio_backend/internal/ports"
	"portifolio_backend/internal/services"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func discardLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

// stubRepoForHandler implements services.ContactRepository for handler tests.
type stubRepoForHandler struct {
	insertFn func(name, email, message string) (uuid.UUID, error)
}

func (s *stubRepoForHandler) Insert(_ context.Context, name, email, message string) (uuid.UUID, time.Time, error) {
	if s.insertFn == nil {
		id := uuid.New()
		return id, time.Now().UTC(), nil
	}
	id, err := s.insertFn(name, email, message)
	if err != nil {
		return uuid.Nil, time.Time{}, err
	}
	return id, time.Now().UTC(), nil
}

func TestContactHandler_SubmitContact_201(t *testing.T) {
	t.Parallel()
	repo := &stubRepoForHandler{
		insertFn: func(_, _, _ string) (uuid.UUID, error) {
			return uuid.MustParse("22222222-2222-2222-2222-222222222222"), nil
		},
	}
	h := NewContactHandler(services.NewContactService(repo, ports.NoOpEventPublisher{}, discardLogger()))
	r := gin.New()
	r.POST("/contact", h.SubmitContact)

	body := `{"name":"Ada","email":"ada@example.com","message":"Hi"}`
	req := httptest.NewRequest(http.MethodPost, "/contact", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("status %d, body %s", w.Code, w.Body.String())
	}
	var got models.SubmitContactResponse
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got.ID != uuid.MustParse("22222222-2222-2222-2222-222222222222") {
		t.Fatalf("id: %v", got.ID)
	}
	if got.CreatedAt.IsZero() {
		t.Fatal("created_at missing")
	}
}

func TestContactHandler_SubmitContact_400_invalidJSON(t *testing.T) {
	t.Parallel()
	h := NewContactHandler(services.NewContactService(&stubRepoForHandler{}, ports.NoOpEventPublisher{}, discardLogger()))
	r := gin.New()
	r.POST("/contact", h.SubmitContact)

	req := httptest.NewRequest(http.MethodPost, "/contact", strings.NewReader(`{`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestContactHandler_SubmitContact_400_bindingEmail(t *testing.T) {
	t.Parallel()
	h := NewContactHandler(services.NewContactService(&stubRepoForHandler{}, ports.NoOpEventPublisher{}, discardLogger()))
	r := gin.New()
	r.POST("/contact", h.SubmitContact)

	body := `{"name":"A","email":"not-an-email","message":"m"}`
	req := httptest.NewRequest(http.MethodPost, "/contact", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestContactHandler_SubmitContact_400_serviceValidation_messageTooLong(t *testing.T) {
	t.Parallel()
	long := strings.Repeat("x", models.MaxMessageLen+1)
	repo := &stubRepoForHandler{
		insertFn: func(_, _, _ string) (uuid.UUID, error) {
			return uuid.Nil, errors.New("Insert must not be called on validation failure")
		},
	}
	h := NewContactHandler(services.NewContactService(repo, ports.NoOpEventPublisher{}, discardLogger()))
	r := gin.New()
	r.POST("/contact", h.SubmitContact)

	payload, _ := json.Marshal(map[string]string{
		"name":    "A",
		"email":   "a@b.co",
		"message": long,
	})
	req := httptest.NewRequest(http.MethodPost, "/contact", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d: %s", w.Code, w.Body.String())
	}
	var erb ErrorResponseBody
	if err := json.Unmarshal(w.Body.Bytes(), &erb); err != nil {
		t.Fatal(err)
	}
	if erb.Error != "validation_error" {
		t.Fatalf("error field: %q", erb.Error)
	}
}

func TestContactHandler_SubmitContact_500_repoError(t *testing.T) {
	t.Parallel()
	repo := &stubRepoForHandler{
		insertFn: func(_, _, _ string) (uuid.UUID, error) {
			return uuid.Nil, errors.New("db error")
		},
	}
	h := NewContactHandler(services.NewContactService(repo, ports.NoOpEventPublisher{}, discardLogger()))
	r := gin.New()
	r.POST("/contact", h.SubmitContact)

	body := `{"name":"A","email":"a@b.co","message":"m"}`
	req := httptest.NewRequest(http.MethodPost, "/contact", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("want 500, got %d: %s", w.Code, w.Body.String())
	}
}
