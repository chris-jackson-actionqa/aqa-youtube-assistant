import {
  PLACEHOLDER_REGEX,
  EMPTY_PLACEHOLDER_REGEX,
  CONSTRAINTS,
  VALIDATION_MESSAGES,
} from "./constants";

/**
 * Validates that the template name meets all requirements
 */
export const validateName = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return VALIDATION_MESSAGES.NAME_EMPTY;
  if (trimmed.length > CONSTRAINTS.NAME_MAX)
    return VALIDATION_MESSAGES.NAME_TOO_LONG;
  return undefined;
};

/**
 * Validates that the template content meets all requirements
 */
export const validateContent = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return VALIDATION_MESSAGES.CONTENT_EMPTY;
  if (trimmed.length > CONSTRAINTS.CONTENT_MAX)
    return VALIDATION_MESSAGES.CONTENT_TOO_LONG;
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
 * Validates that the template type is provided
 */
export const validateType = (value: string): string | undefined => {
  if (!value.trim()) return VALIDATION_MESSAGES.TYPE_REQUIRED;
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
