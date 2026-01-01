import { ApiError } from "../../lib/api";
import { FormErrors } from "./types";
import { ERROR_MESSAGES } from "./constants";

/**
 * Maps API errors to form error messages
 */
export const handleApiError = (error: unknown): FormErrors => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 409:
        // Duplicate content
        return { content: ERROR_MESSAGES.DUPLICATE_CONTENT };
      case 422:
        // Validation error from backend
        return {
          api: error.message || ERROR_MESSAGES.VALIDATION_FAILED,
        };
      case 404:
        // Template not found
        return { api: ERROR_MESSAGES.NOT_FOUND };
      case 0:
        // Network error
        return { api: ERROR_MESSAGES.NETWORK_ERROR };
      default:
        if (error.status >= 500) {
          return { api: ERROR_MESSAGES.SERVER_ERROR };
        }
        return { api: error.message || ERROR_MESSAGES.GENERIC_ERROR };
    }
  }

  return { api: ERROR_MESSAGES.GENERIC_ERROR };
};
