package logger

import (
	"log/slog"
	"os"
)

// New returns a JSON slog.Logger at the given level (stdout). Use for dependency injection instead of a global default.
func New(level slog.Level) *slog.Logger {
	h := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	return slog.New(h)
}
