import {
  PLACEHOLDER_REGEX,
  EMPTY_PLACEHOLDER_REGEX,
  VALIDATION_MESSAGES,
} from "./constants";

/**
 * Validates that the template name meets all requirements
 */
export const validateName = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return VALIDATION_MESSAGES.NAME_EMPTY;
  return undefined;
};

/**
 * Validates that the template content meets all requirements
 */
export const validateContent = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return VALIDATION_MESSAGES.CONTENT_EMPTY;
  return undefined;
};

/**
 * Validates that placeholders exist and follow the correct format
 */
export const validatePlaceholders = (value: string): string | undefined => {
  const matches = value.match(PLACEHOLDER_REGEX) || [];
  if (matches.length === 0) {
    return VALIDATION_MESSAGES.PLACEHOLDERS_MISSING;
  }
  if (EMPTY_PLACEHOLDER_REGEX.test(value)) {
    return VALIDATION_MESSAGES.PLACEHOLDERS_EMPTY;
  }
  return undefined;
};

/**
 * Validates that the template type is provided and allowed
 */
const ALLOWED_TEMPLATE_TYPES = ["title", "description"];

export const validateType = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return VALIDATION_MESSAGES.TYPE_REQUIRED;

  const normalized = trimmed.toLowerCase();
  if (!ALLOWED_TEMPLATE_TYPES.includes(normalized)) {
    return "Template type must be either 'title' or 'description'";
  }
  return undefined;
};

/**
 * Extracts unique placeholders from the content
 */
export const extractPlaceholders = (content: string): string[] => {
  const matches = content.match(PLACEHOLDER_REGEX) || [];
  return Array.from(new Set(matches));
};

/**
 * Performs all validations and returns a map of field errors
 */
export const validateForm = (
  name: string,
  content: string,
  type: string
): Record<string, string | undefined> => {
  return {
    name: validateName(name),
    content: validateContent(content),
    placeholders: validatePlaceholders(content),
    type: validateType(type),
  };
};

/**
 * Checks if the form is valid (no errors present)
 */
export const isFormValid = (
  name: string,
  content: string,
  type: string
): boolean => {
  const errors = validateForm(name, content, type);
  return Object.values(errors).every((error) => !error);
};
