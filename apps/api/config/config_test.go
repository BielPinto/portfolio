package config

import (
	"log/slog"
	"strings"
	"testing"
)

func TestLoad_defaultPortAndComposedDatabaseURL(t *testing.T) {
	t.Setenv("ECS_CONTAINER_METADATA_URI", "")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("PORT", "")
	t.Setenv("DB_HOST", "127.0.0.1")
	t.Setenv("DB_PORT", "5433")
	t.Setenv("DB_USER", "app")
	t.Setenv("DB_PASSWORD", "secret")
	t.Setenv("DB_NAME", "testdb")
	t.Setenv("DB_SSLMODE", "disable")

	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Port != "8080" {
		t.Fatalf("port: %q", cfg.Port)
	}
	if !strings.Contains(cfg.DatabaseURL, "postgres://app:secret@127.0.0.1:5433/testdb") {
		t.Fatalf("database url: %q", cfg.DatabaseURL)
	}
	if !strings.Contains(cfg.DatabaseURL, "sslmode=disable") {
		t.Fatalf("expected sslmode in url: %q", cfg.DatabaseURL)
	}
}

func TestLoad_explicitDatabaseURL(t *testing.T) {
	t.Setenv("ECS_CONTAINER_METADATA_URI", "")
	want := "postgres://u:p@db.example:5432/mydb?sslmode=require"
	t.Setenv("DATABASE_URL", want)
	t.Setenv("PORT", "3000")

	cfg, err := Load()
	if err != nil {
		t.Fatal(err)
	}
	if cfg.DatabaseURL != want {
		t.Fatalf("got %q", cfg.DatabaseURL)
	}
	if cfg.Port != "3000" {
		t.Fatalf("port %q", cfg.Port)
	}
}

func TestLoad_ECS_requiresDatabaseURL(t *testing.T) {
	t.Setenv("ECS_CONTAINER_METADATA_URI", "http://169.254.170.2/v4/abc")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("PORT", "8080")
	_, err := Load()
	if err == nil {
		t.Fatal("expected error when DATABASE_URL missing on ECS")
	}
	if !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Fatalf("err: %v", err)
	}
}

func TestLoad_ECS_rejectsLocalhostDatabaseURL(t *testing.T) {
	t.Setenv("ECS_CONTAINER_METADATA_URI", "http://169.254.170.2/v4/abc")
	t.Setenv("DATABASE_URL", "postgres://u:p@localhost:5432/mydb?sslmode=disable")
	t.Setenv("PORT", "8080")
	_, err := Load()
	if err == nil {
		t.Fatal("expected error for localhost DATABASE_URL on ECS")
	}
	if !strings.Contains(err.Error(), "localhost") {
		t.Fatalf("err: %v", err)
	}
}

func Test_parseLogLevel(t *testing.T) {
	t.Parallel()
	if parseLogLevel("debug") != slog.LevelDebug {
		t.Fatal("debug")
	}
	if parseLogLevel("warn") != slog.LevelWarn {
		t.Fatal("warn")
	}
	if parseLogLevel("error") != slog.LevelError {
		t.Fatal("error")
	}
	if parseLogLevel("") != slog.LevelInfo {
		t.Fatal("default info")
	}
}
