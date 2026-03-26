// Package services implements use cases (validation and orchestration over repositories).
package services

import (
	"context"
	"fmt"
	"log/slog"
	"net/mail"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"portifolio_backend/internal/models"
	"portifolio_backend/internal/ports"
)

// ContactRepository persists new contact submissions.
type ContactRepository interface {
	Insert(ctx context.Context, name, email, message string) (id uuid.UUID, createdAt time.Time, err error)
}

// ContactService orchestrates contact submission (validation + persistence).
type ContactService struct {
	repo      ContactRepository
	publisher ports.EventPublisher
	log       *slog.Logger
}

// NewContactService returns a ContactService with the given repository and optional event publisher.
func NewContactService(repo ContactRepository, publisher ports.EventPublisher, log *slog.Logger) *ContactService {
	if publisher == nil {
		publisher = ports.NoOpEventPublisher{}
	}
	return &ContactService{repo: repo, publisher: publisher, log: log}
}

// SubmitContact validates input and persists a new contact.
func (s *ContactService) SubmitContact(ctx context.Context, req models.SubmitContactRequest) (models.SubmitContactResponse, error) {
	name := strings.TrimSpace(req.Name)
	email := strings.TrimSpace(req.Email)
	message := strings.TrimSpace(req.Message)

	if err := validateSubmitContact(name, email, message); err != nil {
		return models.SubmitContactResponse{}, err
	}

	id, createdAt, err := s.repo.Insert(ctx, name, email, message)
	if err != nil {
		return models.SubmitContactResponse{}, fmt.Errorf("submit contact: %w", err)
	}

	if pubErr := s.publisher.PublishContactCreated(ctx, ports.ContactCreatedEvent{ID: id}); pubErr != nil {
		if s.log != nil {
			s.log.Warn("contact persisted but event publish failed", "contact_id", id, "error", pubErr)
		}
	}

	return models.SubmitContactResponse{ID: id, CreatedAt: createdAt}, nil
}

func validateSubmitContact(name, email, message string) error {
	var agg ValidationFailedError

	if name == "" {
		agg.append("name", "is required")
	} else if utf8.RuneCountInString(name) > models.MaxNameLen {
		agg.append("name", fmt.Sprintf("must be at most %d characters", models.MaxNameLen))
	}

	if email == "" {
		agg.append("email", "is required")
	} else if len(email) > models.MaxEmailLen {
		agg.append("email", fmt.Sprintf("must be at most %d characters", models.MaxEmailLen))
	} else if addr, err := mail.ParseAddress(email); err != nil {
		agg.append("email", "must be a valid email address")
	} else if addr.Address != email {
		agg.append("email", "must be a bare address without display name")
	}

	if message == "" {
		agg.append("message", "is required")
	} else if utf8.RuneCountInString(message) > models.MaxMessageLen {
		agg.append("message", fmt.Sprintf("must be at most %d characters", models.MaxMessageLen))
	}

	if agg.empty() {
		return nil
	}
	return &agg
}
