// Package handlers provides Gin HTTP handlers: binding, status codes, and service calls.
package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"portifolio_backend/internal/models"
	"portifolio_backend/internal/services"
)

// ContactHandler handles public contact endpoints.
type ContactHandler struct {
	svc *services.ContactService
}

// NewContactHandler returns a ContactHandler.
func NewContactHandler(svc *services.ContactService) *ContactHandler {
	return &ContactHandler{svc: svc}
}

// SubmitContact handles POST /contact.
//
// @Summary      Submit contact message
// @Description  Persists a contact form submission (name, email, message).
// @Tags         contact
// @Accept       json
// @Produce      json
// @Param        body body models.SubmitContactRequest true "Payload"
// @Success      201 {object} models.SubmitContactResponse
// @Failure      400 {object} ErrorResponseBody
// @Failure      500 {object} ErrorResponseBody
// @Router       /contact [post]
// @Router       /api/v1/public/contact [post]
func (h *ContactHandler) SubmitContact(c *gin.Context) {
	var req models.SubmitContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondBindError(c, err)
		return
	}

	resp, err := h.svc.SubmitContact(c.Request.Context(), req)
	if err != nil {
		var v *services.ValidationFailedError
		if errors.As(err, &v) {
			details := make([]map[string]any, 0, len(v.Violations))
			for _, vio := range v.Violations {
				details = append(details, map[string]any{"field": vio.Field, "message": vio.Message})
			}
			respondJSON(c, http.StatusBadRequest, ErrorResponseBody{
				Error:   "validation_error",
				Message: "request validation failed",
				Details: details,
			})
			return
		}
		respondInternal(c)
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func respondBindError(c *gin.Context, err error) {
	var verrs validator.ValidationErrors
	if errors.As(err, &verrs) {
		details := make([]map[string]any, 0, len(verrs))
		for _, fe := range verrs {
			details = append(details, map[string]any{
				"field":   strings.ToLower(fe.Field()),
				"message": fe.Tag(),
			})
		}
		respondJSON(c, http.StatusBadRequest, ErrorResponseBody{
			Error:   "validation_error",
			Message: "invalid JSON or binding failed",
			Details: details,
		})
		return
	}
	respondJSON(c, http.StatusBadRequest, ErrorResponseBody{
		Error:   "invalid_request",
		Message: "invalid JSON body",
	})
}
