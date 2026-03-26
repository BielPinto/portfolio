// Package services implements use cases (validation and orchestration over repositories).
package services

import (
	"context"
	"fmt"
	"net/mail"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"portifolio_backend/internal/models"
)

// ContactRepository persists new contact submissions.
type ContactRepository interface {
	Insert(ctx context.Context, name, email, message string) (id uuid.UUID, createdAt time.Time, err error)
}

// ContactService orchestrates contact submission (validation + persistence).
type ContactService struct {
	repo ContactRepository
}

// NewContactService returns a ContactService with the given repository.
func NewContactService(repo ContactRepository) *ContactService {
	return &ContactService{repo: repo}
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
