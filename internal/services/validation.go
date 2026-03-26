package services

// FieldViolation describes one failed validation rule for a single field.
type FieldViolation struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationFailedError is returned when domain validation fails before persistence.
type ValidationFailedError struct {
	Violations []FieldViolation
}

func (e *ValidationFailedError) Error() string {
	return "validation failed"
}

func (e *ValidationFailedError) append(field, message string) {
	e.Violations = append(e.Violations, FieldViolation{Field: field, Message: message})
}

func (e *ValidationFailedError) empty() bool {
	return len(e.Violations) == 0
}
