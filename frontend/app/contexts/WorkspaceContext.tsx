/**
 * Workspace Context Provider
 * Manages workspace state, selection, and CRUD operations
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Workspace,
  WorkspaceCreate,
  WorkspaceUpdate,
} from "../types/workspace";
import { workspaceApi } from "../lib/workspaceApi";

/**
 * Context type definition
 */
export interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;

  // Actions
  selectWorkspace: (workspaceId: number) => void;
  createWorkspace: (data: WorkspaceCreate) => Promise<Workspace>;
  updateWorkspace: (id: number, data: WorkspaceUpdate) => Promise<void>;
  deleteWorkspace: (id: number) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

/**
 * Create context with undefined default
 * This ensures useWorkspace() will throw if used outside provider
 */
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

/**
 * LocalStorage key for persisting selected workspace
 */
const STORAGE_KEY = "aqa-youtube-assistant:selected-workspace-id";

/**
 * WorkspaceProvider component
 * Wraps the application and provides workspace state to all children
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load workspaces and restore selected workspace from localStorage
   */
  useEffect(() => {
    const initializeWorkspaces = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all workspaces
        const fetchedWorkspaces = await workspaceApi.list();
        setWorkspaces(fetchedWorkspaces);

        // Restore selected workspace from localStorage
        const savedId = localStorage.getItem(STORAGE_KEY);
        const workspaceId = savedId ? parseInt(savedId, 10) : 1;

        // Find the workspace by ID, or default to first workspace
        const workspace =
          fetchedWorkspaces.find((w) => w.id === workspaceId) ||
          fetchedWorkspaces[0] ||
          null;

        setCurrentWorkspace(workspace);

        // Save to localStorage if we selected a different workspace
        if (workspace) {
          localStorage.setItem(STORAGE_KEY, workspace.id.toString());
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load workspaces";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWorkspaces();
  }, []);

  /**
   * Save selected workspace to localStorage whenever it changes
   */
  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem(STORAGE_KEY, currentWorkspace.id.toString());
    }
  }, [currentWorkspace]);

  /**
   * Select a workspace by ID
   */
  const selectWorkspace = (workspaceId: number) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
    }
  };

  /**
   * Create a new workspace
   */
  const createWorkspace = async (data: WorkspaceCreate): Promise<Workspace> => {
    setError(null);
    try {
      const newWorkspace = await workspaceApi.create(data);
      await refreshWorkspaces();
      return newWorkspace;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create workspace";
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Update an existing workspace
   */
  const updateWorkspace = async (
    id: number,
    data: WorkspaceUpdate
  ): Promise<void> => {
    setError(null);
    try {
      await workspaceApi.update(id, data);
      await refreshWorkspaces();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update workspace";
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Delete a workspace
   */
  const deleteWorkspace = async (id: number): Promise<void> => {
    setError(null);
    try {
      await workspaceApi.delete(id);
      await refreshWorkspaces();

      // If we deleted the current workspace, select another one from the updated list
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(() => {
          const updated = workspaces.filter((w) => w.id !== id);
          return updated[0] || null;
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete workspace";
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Refresh the list of workspaces from the API
   */
  const refreshWorkspaces = async (): Promise<void> => {
    setError(null);
    try {
      const fetchedWorkspaces = await workspaceApi.list();
      setWorkspaces(fetchedWorkspaces);

      // Update current workspace if it still exists
      if (currentWorkspace) {
        const updatedWorkspace = fetchedWorkspaces.find(
          (w) => w.id === currentWorkspace.id
        );
        if (updatedWorkspace) {
          setCurrentWorkspace(updatedWorkspace);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh workspaces";
      setError(errorMessage);
      throw err;
    }
  };

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    isLoading,
    error,
    selectWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshWorkspaces,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * Custom hook to access workspace context
 * Throws error if used outside WorkspaceProvider
 */
export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
