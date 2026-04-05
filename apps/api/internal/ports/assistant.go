package ports

import (
	"context"

	"github.com/google/uuid"
)

// ContactAssistant summarizes messages or drafts replies via an LLM provider (future adapter).
type ContactAssistant interface {
	Summarize(ctx context.Context, contactID uuid.UUID) (string, error)
	SuggestReply(ctx context.Context, contactID uuid.UUID) (string, error)
}
