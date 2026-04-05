// Package ports defines interfaces for driven adapters (events, mail, LLM, geo).
package ports

import (
	"context"

	"github.com/google/uuid"
)

// ContactCreatedEvent is emitted after a contact row is persisted (async pipeline hook).
type ContactCreatedEvent struct {
	ID uuid.UUID
}

// EventPublisher notifies downstream workers (queue, email, AI) about domain events.
type EventPublisher interface {
	PublishContactCreated(ctx context.Context, ev ContactCreatedEvent) error
}
