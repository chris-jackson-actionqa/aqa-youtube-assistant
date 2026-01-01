// Regex patterns for validation
export const PLACEHOLDER_REGEX = /\{\{[a-zA-Z0-9_\s,-]+\}\}/g;
export const EMPTY_PLACEHOLDER_REGEX = /\{\{\s*\}\}/;

// Validation constraints
export const CONSTRAINTS = {
  NAME_MIN: 1,
  NAME_MAX: 100,
  CONTENT_MIN: 1,
  CONTENT_MAX: 256,
  TYPE_MIN: 1,
  TYPE_MAX: 50,
  MIN_PLACEHOLDERS: 1,
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  NAME_EMPTY: "Template name cannot be empty or contain only whitespace",
  NAME_TOO_LONG: `Template name cannot exceed ${CONSTRAINTS.NAME_MAX} characters`,
  CONTENT_EMPTY: "Template content cannot be empty or contain only whitespace",
  CONTENT_TOO_LONG: `Template content cannot exceed ${CONSTRAINTS.CONTENT_MAX} characters`,
  PLACEHOLDERS_MISSING:
    "Template must contain at least one placeholder (e.g., {{topic}})",
  PLACEHOLDERS_EMPTY: "Empty placeholders {{}} are not allowed",
  TYPE_REQUIRED: "Template type is required",
  TEMPLATE_ID_REQUIRED: "Template ID is required for edit mode",
} as const;

// Error handler messages
export const ERROR_MESSAGES = {
  DUPLICATE_CONTENT:
    "A template with this type and content already exists. Please use different content.",
  VALIDATION_FAILED:
    "Validation failed. Please check your input and try again.",
  NOT_FOUND: "Template not found. It may have been deleted.",
  SERVER_ERROR: "Server error. Please try again later.",
  NETWORK_ERROR:
    "Failed to save template. Please check your connection and try again.",
  GENERIC_ERROR: "Failed to save template. Please try again.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATE: (name: string) => `Template "${name}" created successfully!`,
  UPDATE: (name: string) => `Template "${name}" updated successfully!`,
} as const;
