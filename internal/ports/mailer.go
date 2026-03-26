package ports

import "context"

// Mailer sends transactional email (SMTP, SES, etc.) — implemented by adapters later.
type Mailer interface {
	Send(ctx context.Context, subject, body string, to []string) error
}
