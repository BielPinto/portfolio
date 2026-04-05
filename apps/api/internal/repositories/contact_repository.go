// Package repositories implements PostgreSQL persistence adapters.
package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ContactRepository implements persistence for contacts (PostgreSQL).
type ContactRepository struct {
	pool *pgxpool.Pool
}

// NewContactRepository returns a repository backed by pool.
func NewContactRepository(pool *pgxpool.Pool) *ContactRepository {
	return &ContactRepository{pool: pool}
}

// Insert stores a new contact and returns the generated id and created_at.
func (r *ContactRepository) Insert(ctx context.Context, name, email, message string) (uuid.UUID, time.Time, error) {
	const q = `
		INSERT INTO contacts (name, email, message)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`
	var id uuid.UUID
	var createdAt time.Time
	if err := r.pool.QueryRow(ctx, q, name, email, message).Scan(&id, &createdAt); err != nil {
		return uuid.Nil, time.Time{}, fmt.Errorf("insert contact: %w", err)
	}
	return id, createdAt, nil
}
