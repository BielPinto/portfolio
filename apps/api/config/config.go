package config

import (
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"strings"
)

// Config holds application settings loaded from the environment.
type Config struct {
	Port        string
	DatabaseURL string
	LogLevel    slog.Level
	// RateLimit is a ulule/limiter formatted rate (e.g. "100-M" = 100 requests per minute per IP).
	// Empty, "0", or "off" disables in-memory rate limiting.
	RateLimit string
	// AdminAPIKey, when non-empty, registers the /api/v1/admin route group with auth middleware (routes added later).
	AdminAPIKey string
	// CorsOrigins lists allowed browser origins (comma-separated in CORS_ORIGINS). Empty allows any origin.
	CorsOrigins []string
}

// Load reads configuration from environment variables with safe defaults for local development.
// Database URL: set DATABASE_URL, or compose from DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSLMODE.
func Load() (*Config, error) {
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}
	dbURL, err := loadDatabaseURL()
	if err != nil {
		return nil, err
	}
	rl := strings.TrimSpace(os.Getenv("RATE_LIMIT"))
	if rl == "" {
		rl = "100-M"
	}
	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		LogLevel:    parseLogLevel(os.Getenv("LOG_LEVEL")),
		RateLimit:   rl,
		AdminAPIKey: strings.TrimSpace(os.Getenv("ADMIN_API_KEY")),
		CorsOrigins: parseCSVOrigins(os.Getenv("CORS_ORIGINS")),
	}, nil
}

func parseCSVOrigins(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	var out []string
	for _, p := range strings.Split(raw, ",") {
		if s := strings.TrimSpace(p); s != "" {
			out = append(out, s)
		}
	}
	return out
}

func runningOnECS() bool {
	return strings.TrimSpace(os.Getenv("ECS_CONTAINER_METADATA_URI")) != ""
}

func validateDatabaseURLForECS(raw string) error {
	u, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("DATABASE_URL: invalid URL: %w", err)
	}
	host := strings.ToLower(strings.TrimSpace(u.Hostname()))
	if host == "" || host == "localhost" {
		return fmt.Errorf("DATABASE_URL must use the RDS TCP hostname (e.g. *.rds.amazonaws.com), not localhost or an empty host; on Linux containers localhost uses a Unix socket (/tmp/.s.PGSQL.*) and cannot reach RDS")
	}
	return nil
}

func loadDatabaseURL() (string, error) {
	if raw := strings.TrimSpace(os.Getenv("DATABASE_URL")); raw != "" {
		if runningOnECS() {
			if err := validateDatabaseURLForECS(raw); err != nil {
				return "", err
			}
		}
		return raw, nil
	}
	if runningOnECS() {
		return "", fmt.Errorf("DATABASE_URL is required on ECS/Fargate (inject from Secrets Manager); without it defaults use localhost, which resolves to a Unix socket inside the container and cannot reach RDS")
	}
	host := getenvDefault("DB_HOST", "localhost")
	dbPort := getenvDefault("DB_PORT", "5432")
	user := getenvDefault("DB_USER", "postgres")
	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		password = "postgres"
	}
	dbname := getenvDefault("DB_NAME", "portifolio")
	sslmode := getenvDefault("DB_SSLMODE", "disable")

	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, password),
		Host:   fmt.Sprintf("%s:%s", host, dbPort),
		Path:   "/" + dbname,
	}
	q := url.Values{}
	q.Set("sslmode", sslmode)
	u.RawQuery = q.Encode()
	return u.String(), nil
}

func getenvDefault(key, def string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	return v
}

func parseLogLevel(s string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
