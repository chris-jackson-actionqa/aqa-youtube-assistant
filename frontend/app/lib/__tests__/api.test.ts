/**
 * Unit tests for API client module
 * Tests all API functions and error handling
 */

import {
  ApiError,
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  checkHealth,
} from "../api";
import { Project, ProjectCreate, ProjectUpdate } from "../../types/project";

// Mock fetch globally
global.fetch = jest.fn();

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.log mock
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("ApiError", () => {
    it("should create an ApiError with message, status, and details", () => {
      const error = new ApiError("Test error", 400, { detail: "Bad request" });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("ApiError");
      expect(error.message).toBe("Test error");
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ detail: "Bad request" });
    });

    it("should create an ApiError without details", () => {
      const error = new ApiError("Test error", 500);

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
      expect(error.details).toBeUndefined();
    });
  });

  describe("createProject", () => {
    it("should successfully create a project", async () => {
      const mockProject: Project = {
        id: 1,
        name: "Test Project",
        description: "Test Description",
        status: "planned",
        created_at: "2025-10-21T00:00:00Z",
        updated_at: "2025-10-21T00:00:00Z",
      };

      const projectData: ProjectCreate = {
        name: "Test Project",
        description: "Test Description",
        status: "planned",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      });

      const result = await createProject(projectData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/projects",
        {
          method: "POST",
          body: JSON.stringify(projectData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockProject);
    });

    it("should throw ApiError on 400 Bad Request", async () => {
      const projectData: ProjectCreate = {
        name: "Duplicate",
        description: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ detail: "Project already exists" }),
      });

      await expect(createProject(projectData)).rejects.toThrow(ApiError);

      // Re-mock for second assertion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ detail: "Project already exists" }),
      });

      await expect(createProject(projectData)).rejects.toThrow(
        "Project already exists"
      );
    });
  });

  describe("getProjects", () => {
    it("should successfully fetch all projects", async () => {
      const mockProjects: Project[] = [
        {
          id: 1,
          name: "Project 1",
          description: "Description 1",
          status: "planned",
          created_at: "2025-10-21T00:00:00Z",
          updated_at: "2025-10-21T00:00:00Z",
        },
        {
          id: 2,
          name: "Project 2",
          description: null,
          status: "in_progress",
          created_at: "2025-10-21T00:00:00Z",
          updated_at: "2025-10-21T00:00:00Z",
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
      });

      const result = await getProjects();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/projects",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockProjects);
    });

    it("should return empty array when no projects exist", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await getProjects();
      expect(result).toEqual([]);
    });
  });

  describe("getProject", () => {
    it("should successfully fetch a single project", async () => {
      const mockProject: Project = {
        id: 1,
        name: "Test Project",
        description: "Test Description",
        status: "completed",
        created_at: "2025-10-21T00:00:00Z",
        updated_at: "2025-10-21T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      });

      const result = await getProject(1);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/projects/1",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockProject);
    });

    it("should throw ApiError on 404 Not Found", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Project with id 999 not found" }),
      });

      await expect(getProject(999)).rejects.toThrow(ApiError);

      // Re-mock for second assertion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Project with id 999 not found" }),
      });

      await expect(getProject(999)).rejects.toThrow(
        "Project with id 999 not found"
      );
    });
  });

  describe("updateProject", () => {
    it("should successfully update a project", async () => {
      const updateData: ProjectUpdate = {
        name: "Updated Name",
        status: "completed",
      };

      const mockUpdatedProject: Project = {
        id: 1,
        name: "Updated Name",
        description: "Original Description",
        status: "completed",
        created_at: "2025-10-21T00:00:00Z",
        updated_at: "2025-10-21T01:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedProject,
      });

      const result = await updateProject(1, updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/projects/1",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockUpdatedProject);
    });

    it("should successfully update only description", async () => {
      const updateData: ProjectUpdate = {
        description: "New description only",
      };

      const mockUpdatedProject: Project = {
        id: 1,
        name: "Original Name",
        description: "New description only",
        status: "planned",
        created_at: "2025-10-21T00:00:00Z",
        updated_at: "2025-10-21T01:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedProject,
      });

      const result = await updateProject(1, updateData);
      expect(result.description).toBe("New description only");
    });
  });

  describe("deleteProject", () => {
    it("should successfully delete a project with 204 response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await deleteProject(1);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/projects/1",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual({});
    });

    it("should successfully delete a project with JSON response", async () => {
      const mockResponse = { message: "Project deleted successfully" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await deleteProject(1);

      expect(result).toEqual(mockResponse);
    });

    it("should throw ApiError when deleting non-existent project", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Project with id 999 not found" }),
      });

      await expect(deleteProject(999)).rejects.toThrow(ApiError);
    });
  });

  describe("checkHealth", () => {
    it("should successfully check API health", async () => {
      const mockResponse = { status: "healthy" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await checkHealth();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/health",
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw ApiError when health check fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({ detail: "Service is down" }),
      });

      await expect(checkHealth()).rejects.toThrow(ApiError);

      // Re-mock for second assertion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({ detail: "Service is down" }),
      });

      await expect(checkHealth()).rejects.toThrow("Service is down");
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

      await expect(getProjects()).rejects.toThrow(
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

      await expect(getProjects()).rejects.toThrow(
        "HTTP 500: Internal Server Error"
      );
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(getProjects()).rejects.toThrow(ApiError);
      await expect(getProjects()).rejects.toThrow(
        "Failed to connect to the API. Make sure the backend server is running."
      );
    });

    it("should log API errors to console", async () => {
      const consoleLogSpy = jest.spyOn(console, "log");

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      await expect(getProjects()).rejects.toThrow(ApiError);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "API fetch error:",
        expect.any(Error)
      );
    });

    it("should preserve ApiError when thrown", async () => {
      const apiError = new ApiError("Custom error", 400);

      (global.fetch as jest.Mock).mockRejectedValueOnce(apiError);

      await expect(getProjects()).rejects.toThrow(apiError);
    });

    it("should handle network failure with status 0", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError("Failed to fetch")
      );

      try {
        await getProjects();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(0);
        expect((error as ApiError).message).toContain("Failed to connect");
      }
    });
  });

  describe("Custom Headers", () => {
    it("should merge custom headers with default headers", async () => {
      const mockProject: Project = {
        id: 1,
        name: "Test",
        description: null,
        status: "planned",
        created_at: "2025-10-21T00:00:00Z",
        updated_at: "2025-10-21T00:00:00Z",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      });

      await createProject({ name: "Test" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });
  });

  describe("Environment Configuration", () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;

    afterEach(() => {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it("should use default API URL when env var is not set", async () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "healthy" }),
      });

      await checkHealth();

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/health",
        expect.any(Object)
      );
    });
  });
});
