import {
  validateName,
  validateContent,
  validatePlaceholders,
  validateType,
  extractPlaceholders,
  validateForm,
  isFormValid,
} from "../validation";
import { VALIDATION_MESSAGES } from "../constants";

describe("validation", () => {
  describe("validateName", () => {
    it("should return undefined for valid name", () => {
      expect(validateName("Valid Name")).toBeUndefined();
    });

    it("should return error for empty name", () => {
      expect(validateName("")).toBe(VALIDATION_MESSAGES.NAME_EMPTY);
    });

    it("should return error for whitespace-only name", () => {
      expect(validateName("   ")).toBe(VALIDATION_MESSAGES.NAME_EMPTY);
    });
  });

  describe("validateContent", () => {
    it("should return undefined for valid content", () => {
      expect(validateContent("Valid {{content}}")).toBeUndefined();
    });

    it("should return error for empty content", () => {
      expect(validateContent("")).toBe(VALIDATION_MESSAGES.CONTENT_EMPTY);
    });

    it("should return error for whitespace-only content", () => {
      expect(validateContent("   ")).toBe(VALIDATION_MESSAGES.CONTENT_EMPTY);
    });
  });

  describe("validatePlaceholders", () => {
    it("should return undefined for valid placeholders", () => {
      expect(validatePlaceholders("Test {{placeholder}}")).toBeUndefined();
    });

    it("should return undefined for multiple valid placeholders", () => {
      expect(validatePlaceholders("{{one}} and {{two}}")).toBeUndefined();
    });

    it("should return error for missing placeholders", () => {
      expect(validatePlaceholders("No placeholders here")).toBe(
        VALIDATION_MESSAGES.PLACEHOLDERS_MISSING
      );
    });

    it("should return error for empty placeholders", () => {
      // Empty placeholders won't match PLACEHOLDER_REGEX, so they count as missing
      expect(validatePlaceholders("Test {{}} empty")).toBe(
        VALIDATION_MESSAGES.PLACEHOLDERS_MISSING
      );
    });

    it("should catch empty placeholders even with valid ones", () => {
      // Empty placeholders are caught by EMPTY_PLACEHOLDER_REGEX
      expect(validatePlaceholders("{{valid}} and {{}}")).toBe(
        VALIDATION_MESSAGES.PLACEHOLDERS_EMPTY
      );
    });
  });

  describe("validateType", () => {
    it("should return undefined for 'title' type", () => {
      expect(validateType("title")).toBeUndefined();
    });

    it("should return undefined for 'description' type", () => {
      expect(validateType("description")).toBeUndefined();
    });

    it("should return undefined for 'TITLE' (uppercase)", () => {
      expect(validateType("TITLE")).toBeUndefined();
    });

    it("should return undefined for 'Description' (mixed case)", () => {
      expect(validateType("Description")).toBeUndefined();
    });

    it("should return error for empty type", () => {
      expect(validateType("")).toBe(VALIDATION_MESSAGES.TYPE_REQUIRED);
    });

    it("should return error for whitespace-only type", () => {
      expect(validateType("   ")).toBe(VALIDATION_MESSAGES.TYPE_REQUIRED);
    });

    it("should return error for invalid type", () => {
      const result = validateType("invalid");
      expect(result).toBe(
        "Template type must be either 'title' or 'description'"
      );
    });

    it("should return error for unsupported type", () => {
      const result = validateType("tags");
      expect(result).toBe(
        "Template type must be either 'title' or 'description'"
      );
    });
  });

  describe("extractPlaceholders", () => {
    it("should extract single placeholder", () => {
      const result = extractPlaceholders("Test {{placeholder}}");
      expect(result).toEqual(["{{placeholder}}"]);
    });

    it("should extract multiple placeholders", () => {
      const result = extractPlaceholders("{{one}} and {{two}}");
      expect(result).toEqual(["{{one}}", "{{two}}"]);
    });

    it("should return unique placeholders only", () => {
      const result = extractPlaceholders("{{test}} is {{test}}");
      expect(result).toEqual(["{{test}}"]);
    });

    it("should return empty array when no placeholders", () => {
      const result = extractPlaceholders("No placeholders");
      expect(result).toEqual([]);
    });

    it("should handle empty placeholders", () => {
      // Empty placeholders don't match PLACEHOLDER_REGEX (requires alphanumeric)
      const result = extractPlaceholders("{{}} empty");
      expect(result).toEqual([]);
    });
  });

  describe("validateForm", () => {
    it("should return no errors for valid form", () => {
      const errors = validateForm("Test", "Content {{placeholder}}", "title");
      expect(errors.name).toBeUndefined();
      expect(errors.content).toBeUndefined();
      expect(errors.placeholders).toBeUndefined();
      expect(errors.type).toBeUndefined();
    });

    it("should return all errors for invalid form", () => {
      const errors = validateForm("", "", "invalid");
      expect(errors.name).toBe(VALIDATION_MESSAGES.NAME_EMPTY);
      expect(errors.content).toBe(VALIDATION_MESSAGES.CONTENT_EMPTY);
      expect(errors.placeholders).toBe(
        VALIDATION_MESSAGES.PLACEHOLDERS_MISSING
      );
      expect(errors.type).toBe(
        "Template type must be either 'title' or 'description'"
      );
    });

    it("should validate each field independently", () => {
      const errors = validateForm("Valid Name", "No placeholders", "title");
      expect(errors.name).toBeUndefined();
      expect(errors.content).toBeUndefined();
      expect(errors.placeholders).toBe(
        VALIDATION_MESSAGES.PLACEHOLDERS_MISSING
      );
      expect(errors.type).toBeUndefined();
    });
  });

  describe("isFormValid", () => {
    it("should return true for valid form", () => {
      const result = isFormValid("Test", "Content {{placeholder}}", "title");
      expect(result).toBe(true);
    });

    it("should return false for invalid form", () => {
      const result = isFormValid("", "", "invalid");
      expect(result).toBe(false);
    });

    it("should return false if any field is invalid", () => {
      const result = isFormValid("Valid", "No placeholders", "title");
      expect(result).toBe(false);
    });

    it("should return true for description type", () => {
      const result = isFormValid(
        "Test",
        "Content {{placeholder}}",
        "description"
      );
      expect(result).toBe(true);
    });
  });
});
