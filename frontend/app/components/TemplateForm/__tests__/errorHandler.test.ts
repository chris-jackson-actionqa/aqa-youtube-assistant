import { ApiError } from "../../../lib/api";
import { handleApiError } from "../errorHandler";
import { ERROR_MESSAGES } from "../constants";

describe("handleApiError", () => {
  it("should handle 409 Conflict error", () => {
    const error = new ApiError("Duplicate content", 409);
    const result = handleApiError(error);
    expect(result).toEqual({ content: ERROR_MESSAGES.DUPLICATE_CONTENT });
  });

  it("should handle 422 Validation error with message", () => {
    const error = new ApiError("Invalid input", 422);
    const result = handleApiError(error);
    expect(result).toEqual({ api: "Invalid input" });
  });

  it("should handle 422 Validation error without message", () => {
    const error = new ApiError("", 422);
    const result = handleApiError(error);
    expect(result).toEqual({ api: ERROR_MESSAGES.VALIDATION_FAILED });
  });

  it("should handle 404 Not Found error", () => {
    const error = new ApiError("Not found", 404);
    const result = handleApiError(error);
    expect(result).toEqual({ api: ERROR_MESSAGES.NOT_FOUND });
  });

  it("should handle 0 Network error", () => {
    const error = new ApiError("Network error", 0);
    const result = handleApiError(error);
    expect(result).toEqual({ api: ERROR_MESSAGES.NETWORK_ERROR });
  });

  it("should handle 500+ Server error", () => {
    const error = new ApiError("Internal server error", 500);
    const result = handleApiError(error);
    expect(result).toEqual({ api: ERROR_MESSAGES.SERVER_ERROR });
  });

  it("should handle 503 Server error", () => {
    const error = new ApiError("Service unavailable", 503);
    const result = handleApiError(error);
    expect(result).toEqual({ api: ERROR_MESSAGES.SERVER_ERROR });
  });

  it("should handle other status codes with message", () => {
    const error = new ApiError("Bad request", 400);
    const result = handleApiError(error);
    expect(result).toEqual({ api: "Bad request" });
  });

  it("should handle other status codes without message", () => {
    const error = new ApiError("", 403);
    const result = handleApiError(error);
    expect(result).toEqual({ api: ERROR_MESSAGES.GENERIC_ERROR });
  });

  it("should handle non-ApiError instances", () => {
    const error = new Error("Some error");
    const result = handleApiError(error);
    expect(result).toEqual({ api: ERROR_MESSAGES.GENERIC_ERROR });
  });

  it("should handle unknown error types", () => {
    const result = handleApiError("string error");
    expect(result).toEqual({ api: ERROR_MESSAGES.GENERIC_ERROR });
  });

  it("should handle null", () => {
    const result = handleApiError(null);
    expect(result).toEqual({ api: ERROR_MESSAGES.GENERIC_ERROR });
  });
});
