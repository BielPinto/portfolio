//go:build integration

package integration

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/testcontainers/testcontainers-go/modules/postgres"

	"portifolio_backend/internal/db"
)

var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)

	ctx := context.Background()
	container, err := postgres.Run(ctx, "docker.io/postgres:16-alpine",
		postgres.WithDatabase("portifolio"),
		postgres.BasicWaitStrategies(),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "integration: postgres container: %v\n", err)
		os.Exit(1)
	}

	connStr, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		_ = container.Terminate(ctx)
		fmt.Fprintf(os.Stderr, "integration: connection string: %v\n", err)
		os.Exit(1)
	}

	pool, err := db.NewPool(ctx, connStr)
	if err != nil {
		_ = container.Terminate(ctx)
		fmt.Fprintf(os.Stderr, "integration: db pool: %v\n", err)
		os.Exit(1)
	}

	mctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	migrateErr := db.Migrate(mctx, pool)
	cancel()
	if migrateErr != nil {
		pool.Close()
		_ = container.Terminate(ctx)
		fmt.Fprintf(os.Stderr, "integration: migrate: %v\n", migrateErr)
		os.Exit(1)
	}

	testPool = pool
	code := m.Run()
	pool.Close()
	if termErr := container.Terminate(ctx); termErr != nil {
		fmt.Fprintf(os.Stderr, "integration: terminate container: %v\n", termErr)
	}
	os.Exit(code)
}
