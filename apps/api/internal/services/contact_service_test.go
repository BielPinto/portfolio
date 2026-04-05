package services

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/BielPinto/portfolio/apps/api/internal/models"
	"github.com/BielPinto/portfolio/apps/api/internal/ports"
)

type stubContactRepo struct {
	insertFn func(ctx context.Context, name, email, message string) (uuid.UUID, time.Time, error)
}

func (s *stubContactRepo) Insert(ctx context.Context, name, email, message string) (uuid.UUID, time.Time, error) {
	if s.insertFn != nil {
		return s.insertFn(ctx, name, email, message)
	}
	id := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	return id, time.Date(2025, 3, 25, 12, 0, 0, 0, time.UTC), nil
}

type errPublisher struct{}

func (errPublisher) PublishContactCreated(context.Context, ports.ContactCreatedEvent) error {
	return errors.New("publish failed")
}

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestContactService_SubmitContact_success(t *testing.T) {
	t.Parallel()
	repo := &stubContactRepo{}
	svc := NewContactService(repo, ports.NoOpEventPublisher{}, testLogger())
	resp, err := svc.SubmitContact(context.Background(), models.SubmitContactRequest{
		Name:    "Ada",
		Email:   "ada@example.com",
		Message: "Hello",
	})
	if err != nil {
		t.Fatalf("SubmitContact: %v", err)
	}
	if resp.ID == uuid.Nil {
		t.Fatal("expected non-nil id")
	}
	if resp.CreatedAt.IsZero() {
		t.Fatal("expected created_at")
	}
}

func TestContactService_SubmitContact_trimsFields(t *testing.T) {
	t.Parallel()
	var gotName, gotEmail, gotMsg string
	repo := &stubContactRepo{
		insertFn: func(_ context.Context, name, email, message string) (uuid.UUID, time.Time, error) {
			gotName, gotEmail, gotMsg = name, email, message
			return uuid.New(), time.Now().UTC(), nil
		},
	}
	svc := NewContactService(repo, ports.NoOpEventPublisher{}, testLogger())
	_, err := svc.SubmitContact(context.Background(), models.SubmitContactRequest{
		Name:    "  Bob  ",
		Email:   "  bob@example.com  ",
		Message: "  hi  ",
	})
	if err != nil {
		t.Fatal(err)
	}
	if gotName != "Bob" || gotEmail != "bob@example.com" || gotMsg != "hi" {
		t.Fatalf("unexpected trimmed values: %q %q %q", gotName, gotEmail, gotMsg)
	}
}

func TestContactService_SubmitContact_publisherErrorStillSucceeds(t *testing.T) {
	t.Parallel()
	repo := &stubContactRepo{}
	svc := NewContactService(repo, errPublisher{}, testLogger())
	resp, err := svc.SubmitContact(context.Background(), models.SubmitContactRequest{
		Name: "x", Email: "x@y.co", Message: "m",
	})
	if err != nil {
		t.Fatalf("expected success despite publisher error: %v", err)
	}
	if resp.ID == uuid.Nil {
		t.Fatal("expected id")
	}
}

func TestContactService_SubmitContact_repoError(t *testing.T) {
	t.Parallel()
	repo := &stubContactRepo{
		insertFn: func(context.Context, string, string, string) (uuid.UUID, time.Time, error) {
			return uuid.Nil, time.Time{}, errors.New("db down")
		},
	}
	svc := NewContactService(repo, ports.NoOpEventPublisher{}, testLogger())
	_, err := svc.SubmitContact(context.Background(), models.SubmitContactRequest{
		Name: "a", Email: "a@b.co", Message: "c",
	})
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestContactService_SubmitContact_validation(t *testing.T) {
	t.Parallel()
	longName := strings.Repeat("a", models.MaxNameLen+1)
	longMsg := strings.Repeat("m", models.MaxMessageLen+1)
	longEmail := strings.Repeat("a", models.MaxEmailLen) + "@b.co" // len > MaxEmailLen

	tests := []struct {
		name string
		req  models.SubmitContactRequest
	}{
		{"empty name", models.SubmitContactRequest{Name: "", Email: "a@b.co", Message: "x"}},
		{"name too long", models.SubmitContactRequest{Name: longName, Email: "a@b.co", Message: "x"}},
		{"empty email", models.SubmitContactRequest{Name: "a", Email: "", Message: "x"}},
		{"invalid email", models.SubmitContactRequest{Name: "a", Email: "not-email", Message: "x"}},
		{"display name email", models.SubmitContactRequest{Name: "a", Email: "Foo <foo@bar.com>", Message: "x"}},
		{"email too long", models.SubmitContactRequest{Name: "a", Email: longEmail, Message: "x"}},
		{"empty message", models.SubmitContactRequest{Name: "a", Email: "a@b.co", Message: ""}},
		{"message too long", models.SubmitContactRequest{Name: "a", Email: "a@b.co", Message: longMsg}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			calls := 0
			repo := &stubContactRepo{
				insertFn: func(context.Context, string, string, string) (uuid.UUID, time.Time, error) {
					calls++
					return uuid.New(), time.Now().UTC(), nil
				},
			}
			svc := NewContactService(repo, ports.NoOpEventPublisher{}, testLogger())
			_, err := svc.SubmitContact(context.Background(), tt.req)
			var v *ValidationFailedError
			if !errors.As(err, &v) {
				t.Fatalf("want ValidationFailedError, got %v", err)
			}
			if calls != 0 {
				t.Fatalf("repo.Insert should not run on validation failure, calls=%d", calls)
			}
		})
	}
}

func TestNewContactService_nilPublisherUsesNoOp(t *testing.T) {
	t.Parallel()
	repo := &stubContactRepo{}
	svc := NewContactService(repo, nil, testLogger())
	_, err := svc.SubmitContact(context.Background(), models.SubmitContactRequest{
		Name: "a", Email: "a@b.co", Message: "b",
	})
	if err != nil {
		t.Fatal(err)
	}
}
