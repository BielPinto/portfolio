package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponseBody is the JSON shape for client errors and safe server errors.
type ErrorResponseBody struct {
	Error   string           `json:"error"`
	Message string           `json:"message,omitempty"`
	Details []map[string]any `json:"details,omitempty"`
}

func respondJSON(c *gin.Context, status int, body any) {
	c.JSON(status, body)
}

func respondInternal(c *gin.Context) {
	respondJSON(c, http.StatusInternalServerError, ErrorResponseBody{
		Error:   "internal_error",
		Message: "something went wrong",
	})
}
