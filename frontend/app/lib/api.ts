/**
 * API utility functions for interacting with FastAPI backend
 * Base URL: http://localhost:8000
 */

import { Project, ProjectCreate, ProjectUpdate } from "../types/project";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.log("API fetch error:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parsing errors
    throw new ApiError(
      "Failed to connect to the API. Make sure the backend server is running.",
      0,
      error
    );
  }
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectCreate): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get all projects
 */
export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

/**
 * Get a single project by ID
 */
export async function getProject(id: number): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`);
}

/**
 * Update a project
 */
export async function updateProject(
  id: number,
  data: ProjectUpdate
): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a project
 */
export async function deleteProject(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/projects/${id}`, {
    method: "DELETE",
  });
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/health");
}
