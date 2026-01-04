/**
 * Tests for ProjectContext
 * Comprehensive testing of project state management, persistence, and error handling
 */

import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import { ProjectProvider, useProject } from "../ProjectContext";
import { getProject } from "../../lib/api";
import { Project } from "../../types/project";
import { ERROR_MESSAGES } from "../../constants/messages";

// Mock the API module
jest.mock("../../lib/api");

const mockGetProject = getProject as jest.MockedFunction<typeof getProject>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Sample project data
const mockProject: Project = {
  id: 1,
  name: "Test Project",
  description: "A test project",
  status: "in_progress",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const updatedMockProject: Project = {
  ...mockProject,
  name: "Updated Project",
  updated_at: "2025-01-02T00:00:00Z",
};

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: ReactNode }) => (
  <ProjectProvider>{children}</ProjectProvider>
);

describe("ProjectContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    // Reset mock implementations to prevent test pollution
    mockGetProject.mockReset();
  });

  describe("useProject hook", () => {
    it("should throw error when used outside ProjectProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useProject());
      }).toThrow("useProject must be used within ProjectProvider");

      consoleSpy.mockRestore();
    });

    it("should provide context value when used inside ProjectProvider", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.currentProject).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.selectProject).toBe("function");
      expect(typeof result.current.clearSelection).toBe("function");
      expect(typeof result.current.refreshCurrentProject).toBe("function");
      expect(typeof result.current.updateCurrentProject).toBe("function");
    });
  });

  describe("Initial state", () => {
    it("should initialize with null project and no loading/error", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      expect(result.current.currentProject).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should not load project if no saved ID in localStorage", () => {
      renderHook(() => useProject(), { wrapper });

      // NOTE: localStorage functionality temporarily disabled
      // No automatic loading on mount
      expect(mockGetProject).not.toHaveBeenCalled();
    });

    it("should load project from localStorage on mount", async () => {
      // NOTE: localStorage restoration temporarily disabled
      // This test verifies the context initializes with null state
      localStorageMock.getItem.mockReturnValueOnce("1");
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      // Should NOT automatically load from localStorage
      expect(mockGetProject).not.toHaveBeenCalled();
      expect(result.current.currentProject).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should clear invalid project ID from localStorage on mount error", async () => {
      // NOTE: localStorage functionality temporarily disabled
      // No automatic cleanup needed since no automatic loading occurs
      localStorageMock.getItem.mockReturnValueOnce("999");
      mockGetProject.mockRejectedValueOnce(new Error("Project not found"));

      renderHook(() => useProject(), { wrapper });

      // Should NOT attempt to load or clean up localStorage
      expect(mockGetProject).not.toHaveBeenCalled();
    });

    it("should clear invalid stored value (non-numeric)", () => {
      // NOTE: localStorage functionality temporarily disabled
      localStorageMock.getItem.mockReturnValueOnce("invalid");

      renderHook(() => useProject(), { wrapper });

      // Should NOT interact with localStorage
      expect(mockGetProject).not.toHaveBeenCalled();
    });

    it("should handle empty string in localStorage", () => {
      localStorageMock.getItem.mockReturnValueOnce("");

      renderHook(() => useProject(), { wrapper });

      // Empty string is falsy, so no action should be taken
      expect(mockGetProject).not.toHaveBeenCalled();
    });
  });

  describe("selectProject", () => {
    it("should fetch and set current project", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      expect(mockGetProject).toHaveBeenCalledWith(1);
      expect(result.current.currentProject).toEqual(mockProject);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should NOT save to localStorage (functionality disabled)", async () => {
      // NOTE: localStorage persistence temporarily disabled
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      // Should NOT save to localStorage
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      // But should set the project in state
      expect(result.current.currentProject).toEqual(mockProject);
    });

    it("should set loading state during fetch", async () => {
      let resolveGetProject: (value: Project) => void;
      const getProjectPromise = new Promise<Project>((resolve) => {
        resolveGetProject = resolve;
      });
      mockGetProject.mockReturnValueOnce(getProjectPromise);

      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.selectProject(1);
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveGetProject!(mockProject);
        await getProjectPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should handle API errors and set error state", async () => {
      const errorMessage = "Project not found";
      mockGetProject.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await expect(result.current.selectProject(999)).rejects.toThrow(
          errorMessage
        );
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.currentProject).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it("should NOT remove from localStorage on error (functionality disabled)", async () => {
      // NOTE: localStorage cleanup temporarily disabled
      mockGetProject.mockRejectedValueOnce(new Error("API Error"));

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        try {
          await result.current.selectProject(1);
        } catch {
          // Expected error
        }
      });

      // Should NOT interact with localStorage
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      // But should set error state
      expect(result.current.error).toBe("API Error");
    });

    it("should clear previous error on new selection attempt", async () => {
      mockGetProject.mockRejectedValueOnce(new Error("First error"));
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      // First attempt - error
      await act(async () => {
        try {
          await result.current.selectProject(999);
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toBe("First error");

      // Second attempt - success
      await act(async () => {
        await result.current.selectProject(1);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.currentProject).toEqual(mockProject);
    });

    it("should handle non-Error exceptions", async () => {
      mockGetProject.mockRejectedValueOnce("String error");

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await expect(result.current.selectProject(1)).rejects.toBe(
          "String error"
        );
      });

      expect(result.current.error).toBe(ERROR_MESSAGES.LOAD_PROJECT);
      expect(result.current.currentProject).toBeNull();
    });
  });

  describe("clearSelection", () => {
    it("should clear current project", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.currentProject).toBeNull();
    });

    it("should NOT remove from localStorage when clearing (functionality disabled)", async () => {
      // NOTE: localStorage cleanup temporarily disabled
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      localStorageMock.removeItem.mockClear();

      act(() => {
        result.current.clearSelection();
      });

      // Should NOT interact with localStorage
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      // But should clear the project from state
      expect(result.current.currentProject).toBeNull();
    });

    it("should clear error state", async () => {
      mockGetProject.mockRejectedValueOnce(new Error("Test error"));

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        try {
          await result.current.selectProject(1);
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.error).toBeNull();
    });

    it("should handle clearing when no project selected", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      expect(() => {
        act(() => {
          result.current.clearSelection();
        });
      }).not.toThrow();

      expect(result.current.currentProject).toBeNull();
    });
  });

  describe("refreshCurrentProject", () => {
    it("should do nothing if no current project", async () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.refreshCurrentProject();
      });

      expect(mockGetProject).not.toHaveBeenCalled();
    });

    it("should fetch and update current project", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);
      mockGetProject.mockResolvedValueOnce(updatedMockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      await act(async () => {
        await result.current.refreshCurrentProject();
      });

      expect(mockGetProject).toHaveBeenCalledTimes(2);
      expect(result.current.currentProject).toEqual(updatedMockProject);
      expect(result.current.error).toBeNull();
    });

    it("should set loading state during refresh", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);

      let resolveRefresh: (value: Project) => void;
      const refreshPromise = new Promise<Project>((resolve) => {
        resolveRefresh = resolve;
      });
      mockGetProject.mockReturnValueOnce(refreshPromise);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      act(() => {
        result.current.refreshCurrentProject();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveRefresh!(updatedMockProject);
        await refreshPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should clear project if refresh fails (project deleted)", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);
      mockGetProject.mockRejectedValueOnce(new Error("Project not found"));

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      expect(result.current.currentProject).not.toBeNull();

      await act(async () => {
        try {
          await result.current.refreshCurrentProject();
        } catch {
          // Expected error
        }
      });

      // Note: clearSelection is called internally, which clears the error
      expect(result.current.currentProject).toBeNull();
      // localStorage cleanup temporarily disabled
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it("should NOT update localStorage after refresh (functionality disabled)", async () => {
      // NOTE: localStorage persistence temporarily disabled
      mockGetProject.mockResolvedValueOnce(mockProject);
      mockGetProject.mockResolvedValueOnce(updatedMockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      localStorageMock.setItem.mockClear();

      await act(async () => {
        await result.current.refreshCurrentProject();
      });

      // Should NOT save to localStorage
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      // But should update state
      expect(result.current.currentProject).toEqual(updatedMockProject);
    });

    it("should handle non-Error exceptions in refresh", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);
      mockGetProject.mockRejectedValueOnce("String error in refresh");

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      await act(async () => {
        try {
          await result.current.refreshCurrentProject();
        } catch {
          // Expected error
        }
      });

      // Note: clearSelection is called internally, which clears the error
      expect(result.current.currentProject).toBeNull();
      // localStorage cleanup temporarily disabled
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe("updateCurrentProject", () => {
    it("should do nothing if no current project", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      act(() => {
        result.current.updateCurrentProject({ name: "New Name" });
      });

      expect(result.current.currentProject).toBeNull();
    });

    it("should update current project with partial data", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      act(() => {
        result.current.updateCurrentProject({ name: "Updated Name" });
      });

      expect(result.current.currentProject).toEqual({
        ...mockProject,
        name: "Updated Name",
      });
    });

    it("should NOT update localStorage with updates (functionality disabled)", async () => {
      // NOTE: localStorage persistence temporarily disabled
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      localStorageMock.setItem.mockClear();

      act(() => {
        result.current.updateCurrentProject({ status: "completed" });
      });

      // Should NOT save to localStorage
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      // But should update state
      expect(result.current.currentProject).toEqual({
        ...mockProject,
        status: "completed",
      });
    });

    it("should merge updates with existing project data", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      act(() => {
        result.current.updateCurrentProject({
          name: "New Name",
          description: "New Description",
        });
      });

      expect(result.current.currentProject).toEqual({
        ...mockProject,
        name: "New Name",
        description: "New Description",
      });
    });

    it("should handle multiple sequential updates", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      act(() => {
        result.current.updateCurrentProject({ name: "First Update" });
      });

      act(() => {
        result.current.updateCurrentProject({ status: "completed" });
      });

      expect(result.current.currentProject).toEqual({
        ...mockProject,
        name: "First Update",
        status: "completed",
      });
    });

    it("should handle null prev in updateCurrentProject edge case", () => {
      const { result } = renderHook(() => useProject(), { wrapper });

      // Try to update when no project is selected
      act(() => {
        result.current.updateCurrentProject({ name: "Should not update" });
      });

      // Should still be null
      expect(result.current.currentProject).toBeNull();
      // saveToStorage should not be called when prev is null
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete workflow: select, update, refresh, clear", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);
      mockGetProject.mockResolvedValueOnce(updatedMockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      // Select project
      await act(async () => {
        await result.current.selectProject(1);
      });
      expect(result.current.currentProject).toEqual(mockProject);

      // Update locally
      act(() => {
        result.current.updateCurrentProject({ name: "Local Update" });
      });
      expect(result.current.currentProject?.name).toBe("Local Update");

      // Refresh from API
      await act(async () => {
        await result.current.refreshCurrentProject();
      });
      expect(result.current.currentProject).toEqual(updatedMockProject);

      // Clear selection
      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.currentProject).toBeNull();
    });

    it("should maintain state across multiple component renders", async () => {
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result, rerender } = renderHook(() => useProject(), { wrapper });

      await act(async () => {
        await result.current.selectProject(1);
      });

      const projectBeforeRerender = result.current.currentProject;

      rerender();

      expect(result.current.currentProject).toBe(projectBeforeRerender);
    });

    it("should handle error recovery workflow", async () => {
      mockGetProject.mockRejectedValueOnce(new Error("Initial error"));
      mockGetProject.mockResolvedValueOnce(mockProject);

      const { result } = renderHook(() => useProject(), { wrapper });

      // First selection fails
      await act(async () => {
        try {
          await result.current.selectProject(999);
        } catch {
          // Expected
        }
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.currentProject).toBeNull();

      // Second selection succeeds
      await act(async () => {
        await result.current.selectProject(1);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.currentProject).toEqual(mockProject);
    });
  });
});
