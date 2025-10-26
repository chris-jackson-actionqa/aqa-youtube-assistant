'use client';

/**
 * ProjectContext - Global state management for the currently active/selected project
 * 
 * Provides project selection state, persistence via localStorage, and actions
 * for managing the current project throughout the application.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project } from '../types/project';
import { getProject } from '../lib/api';

interface ProjectContextValue {
  /** Currently selected project */
  currentProject: Project | null;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message if operation fails */
  error: string | null;
  
  /** Select a project by ID - fetches from API and saves to localStorage */
  selectProject: (projectId: number) => Promise<void>;
  /** Clear the current project selection */
  clearSelection: () => void;
  /** Refresh the current project from the API */
  refreshCurrentProject: () => Promise<void>;
  /** Update the current project state without API call */
  updateCurrentProject: (updates: Partial<Project>) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const STORAGE_KEY = 'currentProjectId';

interface ProjectProviderProps {
  children: ReactNode;
}

/**
 * ProjectProvider - Wraps the application to provide project state
 * 
 * @example
 * <ProjectProvider>
 *   <App />
 * </ProjectProvider>
 */
export function ProjectProvider({ children }: ProjectProviderProps) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Save project ID to localStorage
   */
  const saveToStorage = useCallback((project: Project | null) => {
    if (project) {
      localStorage.setItem(STORAGE_KEY, String(project.id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /**
   * Select a project by ID - fetches full details from API
   */
  const selectProject = useCallback(async (projectId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const project = await getProject(projectId);
      setCurrentProject(project);
      saveToStorage(project);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project';
      setError(errorMessage);
      // Clear invalid project from storage
      localStorage.removeItem(STORAGE_KEY);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  /**
   * Clear the current project selection
   */
  const clearSelection = useCallback(() => {
    setCurrentProject(null);
    setError(null);
    saveToStorage(null);
  }, [saveToStorage]);

  /**
   * Refresh the current project from the API
   */
  const refreshCurrentProject = useCallback(async () => {
    if (!currentProject) return;

    setIsLoading(true);
    setError(null);

    try {
      const project = await getProject(currentProject.id);
      setCurrentProject(project);
      saveToStorage(project);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh project';
      setError(errorMessage);
      // Clear project if it no longer exists
      clearSelection();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, saveToStorage, clearSelection]);

  /**
   * Update the current project state without API call
   * Useful for optimistic updates
   */
  const updateCurrentProject = useCallback((updates: Partial<Project>) => {
    setCurrentProject(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  /**
   * Load saved project from localStorage on mount
   */
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const projectId = Number(savedId);
      if (!isNaN(projectId)) {
        selectProject(projectId).catch(() => {
          // Error already handled in selectProject
          // Storage cleared automatically
        });
      } else {
        // Invalid stored value
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: ProjectContextValue = {
    currentProject,
    isLoading,
    error,
    selectProject,
    clearSelection,
    refreshCurrentProject,
    updateCurrentProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * Custom hook to access project context
 * 
 * @throws {Error} If used outside of ProjectProvider
 * 
 * @example
 * const { currentProject, selectProject } = useProject();
 */
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
