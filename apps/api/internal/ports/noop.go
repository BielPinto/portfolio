package ports

import (
	"context"

	"github.com/google/uuid"
)

// NoOpEventPublisher discards events (replace with queue/SNS adapter in production).
type NoOpEventPublisher struct{}

func (NoOpEventPublisher) PublishContactCreated(context.Context, ContactCreatedEvent) error {
	return nil
}

// NoOpMailer discards outbound mail.
type NoOpMailer struct{}

func (NoOpMailer) Send(context.Context, string, string, []string) error {
	return nil
}

// NoOpContactAssistant returns empty strings (LLM adapter plugs in later).
type NoOpContactAssistant struct{}

func (NoOpContactAssistant) Summarize(context.Context, uuid.UUID) (string, error) {
	return "", nil
}

func (NoOpContactAssistant) SuggestReply(context.Context, uuid.UUID) (string, error) {
	return "", nil
}

// NoOpGeoResolver returns empty country code.
type NoOpGeoResolver struct{}

func (NoOpGeoResolver) ResolveCountryCode(context.Context, string) (string, error) {
	return "", nil
}
