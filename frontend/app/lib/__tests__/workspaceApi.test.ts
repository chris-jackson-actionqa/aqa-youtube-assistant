/**
 * Unit tests for Workspace API client
 * Tests all workspace API functions and error handling
 */

import { workspaceApi, WorkspaceApiError } from "../workspaceApi";
import { Workspace } from "../../types/workspace";

// Mock fetch globally
global.fetch = jest.fn();

describe("Workspace API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("WorkspaceApiError", () => {
    it("should create a WorkspaceApiError with message, status, and details", () => {
      const error = new WorkspaceApiError("Test error", 400, {
        detail: "Bad request",
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("WorkspaceApiError");
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ detail: "Bad request" });
    });

    it("should create a WorkspaceApiError without details", () => {
      const error = new WorkspaceApiError("Test error", 500);

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
      expect(error.details).toBeUndefined();
    });
  });

  describe("workspaceApi.list", () => {
    it("should successfully fetch all workspaces", async () => {
      const mockWorkspaces: Workspace[] = [
        {
          id: 1,
          name: "Default Workspace",
          description: "Default workspace",
          created_at: "2025-10-21T00:00:00Z",
        },
        {
          id: 2,
          name: "Test Workspace",
          description: "Test workspace",
          created_at: "2025-10-22T00:00:00Z",
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const result = await workspaceApi.list();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/workspaces",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockWorkspaces);
    });

    it("should return empty array when no workspaces exist", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await workspaceApi.list();

      expect(result).toEqual([]);
    });

    it("should throw WorkspaceApiError on fetch failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ detail: "Database error" }),
      });

      await expect(workspaceApi.list()).rejects.toThrow(WorkspaceApiError);

      // Reset mock for second call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ detail: "Database error" }),
      });

      await expect(workspaceApi.list()).rejects.toThrow("Database error");
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(workspaceApi.list()).rejects.toThrow(WorkspaceApiError);
      await expect(workspaceApi.list()).rejects.toThrow(
        "Failed to connect to the API"
      );
    });
  });

  describe("workspaceApi.get", () => {
    it("should successfully fetch a single workspace", async () => {
      const mockWorkspace: Workspace = {
        id: 1,
        name: "Test Workspace",
        description: "Test description",
        created_at: "2025-10-21T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkspace,
      });

      const result = await workspaceApi.get(1);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/workspaces/1",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockWorkspace);
    });

    it("should throw WorkspaceApiError on 404 Not Found", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Workspace not found" }),
      });

      await expect(workspaceApi.get(999)).rejects.toThrow(WorkspaceApiError);

      // Reset mock for second call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Workspace not found" }),
      });

      await expect(workspaceApi.get(999)).rejects.toThrow(
        "Workspace not found"
      );
    });
  });

  describe("workspaceApi.create", () => {
    it("should successfully create a workspace", async () => {
      const mockWorkspace: Workspace = {
        id: 3,
        name: "New Workspace",
        description: "New workspace description",
        created_at: "2025-10-23T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkspace,
      });

      const result = await workspaceApi.create(
        "New Workspace",
        "New workspace description"
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/workspaces",
        {
          method: "POST",
          body: JSON.stringify({
            name: "New Workspace",
            description: "New workspace description",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockWorkspace);
    });

    it("should throw WorkspaceApiError on 400 Bad Request", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ detail: "Workspace name already exists" }),
      });

      await expect(
        workspaceApi.create("Duplicate", "Duplicate workspace")
      ).rejects.toThrow(WorkspaceApiError);

      // Reset mock for second call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ detail: "Workspace name already exists" }),
      });

      await expect(
        workspaceApi.create("Duplicate", "Duplicate workspace")
      ).rejects.toThrow("Workspace name already exists");
    });
  });

  describe("workspaceApi.update", () => {
    it("should successfully update a workspace", async () => {
      const mockUpdatedWorkspace: Workspace = {
        id: 1,
        name: "Updated Name",
        description: "Updated description",
        created_at: "2025-10-21T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedWorkspace,
      });

      const result = await workspaceApi.update(
        1,
        "Updated Name",
        "Updated description"
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/workspaces/1",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Name",
            description: "Updated description",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockUpdatedWorkspace);
    });

    it("should throw WorkspaceApiError on 404 Not Found", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Workspace not found" }),
      });

      await expect(
        workspaceApi.update(999, "Name", "Description")
      ).rejects.toThrow(WorkspaceApiError);

      // Reset mock for second call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Workspace not found" }),
      });

      await expect(
        workspaceApi.update(999, "Name", "Description")
      ).rejects.toThrow("Workspace not found");
    });
  });

  describe("workspaceApi.delete", () => {
    it("should successfully delete a workspace with 204 response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await workspaceApi.delete(1);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/workspaces/1",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual({});
    });

    it("should successfully delete a workspace with JSON response", async () => {
      const mockResponse = { message: "Workspace deleted successfully" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await workspaceApi.delete(1);

      expect(result).toEqual(mockResponse);
    });

    it("should throw WorkspaceApiError when deleting non-existent workspace", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Workspace not found" }),
      });

      await expect(workspaceApi.delete(999)).rejects.toThrow(WorkspaceApiError);

      // Reset mock for second call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Workspace not found" }),
      });

      await expect(workspaceApi.delete(999)).rejects.toThrow(
        "Workspace not found"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle HTTP error without detail in response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({}),
      });

      await expect(workspaceApi.list()).rejects.toThrow(
        "HTTP 500: Internal Server Error"
      );
    });

    it("should handle JSON parsing errors in error response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(workspaceApi.list()).rejects.toThrow(
        "HTTP 500: Internal Server Error"
      );
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to fetch")
      );

      await expect(workspaceApi.list()).rejects.toThrow(
        "Failed to connect to the API"
      );
    });

    it("should preserve WorkspaceApiError when thrown", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ detail: "Validation error" }),
      });

      try {
        await workspaceApi.list();
        fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(WorkspaceApiError);
        expect((error as WorkspaceApiError).status).toBe(400);
      }
    });

    it("should handle network failure with status 0", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError("Network request failed")
      );

      try {
        await workspaceApi.list();
        fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(WorkspaceApiError);
        expect((error as WorkspaceApiError).status).toBe(0);
      }
    });
  });
});
