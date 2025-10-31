/**
 * API service for workspace operations
 * Handles CRUD operations for workspaces
 */

import {
  Workspace,
  WorkspaceCreate,
  WorkspaceUpdate,
} from "../types/workspace";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Custom error class for API errors
 */
export class WorkspaceApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "WorkspaceApiError";
  }
}

/**
 * Generic fetch wrapper with error handling for workspace operations
 */
async function workspaceApiFetch<T>(
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
      throw new WorkspaceApiError(
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
    if (error instanceof WorkspaceApiError) {
      throw error;
    }
    // Network or parsing errors
    throw new WorkspaceApiError(
      "Failed to connect to the API. Make sure the backend server is running.",
      0,
      error
    );
  }
}

/**
 * Workspace API service
 */
export const workspaceApi = {
  /**
   * Get all workspaces
   */
  list: async (): Promise<Workspace[]> => {
    return workspaceApiFetch<Workspace[]>("/api/workspaces");
  },

  /**
   * Get a single workspace by ID
   */
  get: async (id: number): Promise<Workspace> => {
    return workspaceApiFetch<Workspace>(`/api/workspaces/${id}`);
  },

  /**
   * Create a new workspace
   */
  create: async (data: WorkspaceCreate): Promise<Workspace> => {
    return workspaceApiFetch<Workspace>("/api/workspaces", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing workspace
   */
  update: async (id: number, data: WorkspaceUpdate): Promise<Workspace> => {
    return workspaceApiFetch<Workspace>(`/api/workspaces/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a workspace
   */
  delete: async (id: number): Promise<{ message: string }> => {
    return workspaceApiFetch<{ message: string }>(`/api/workspaces/${id}`, {
      method: "DELETE",
    });
  },
};
