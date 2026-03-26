// Package models defines domain types and request/response DTOs for the API.
package models

import (
	"time"

	"github.com/google/uuid"
)

// Field limits align with the contacts table and public API contract.
const (
	MaxNameLen    = 255
	MaxEmailLen   = 320
	MaxMessageLen = 10000
)

// Contact is a persisted contact message.
type Contact struct {
	ID        uuid.UUID
	Name      string
	Email     string
	Message   string
	CreatedAt time.Time
}

// SubmitContactRequest is the JSON body for POST /contact.
type SubmitContactRequest struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email" binding:"required,email"`
	Message string `json:"message" binding:"required"`
}

// SubmitContactResponse is returned after a successful submit (201).
type SubmitContactResponse struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
}
