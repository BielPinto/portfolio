package migrations

import "embed"

// Files holds versioned SQL applied at startup (see internal/db).
//
//go:embed *.sql
var Files embed.FS
