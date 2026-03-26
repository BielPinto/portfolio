package config

import "os"

// Config holds application settings loaded from the environment.
type Config struct {
	Port string
}

// Load reads configuration from environment variables with safe defaults for local development.
func Load() (*Config, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return &Config{Port: port}, nil
}
