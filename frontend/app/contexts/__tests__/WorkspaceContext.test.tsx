/**
 * Unit tests for WorkspaceContext
 * Tests workspace state management, localStorage persistence, and API integration
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { WorkspaceProvider, useWorkspace } from "../WorkspaceContext";
import { workspaceApi } from "../../lib/workspaceApi";
import { Workspace } from "../../types/workspace";

// Mock the workspace API
jest.mock("../../lib/workspaceApi");

// Test component that uses the workspace context
function TestComponent() {
  const {
    currentWorkspace,
    workspaces,
    isLoading,
    error,
    selectWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refreshWorkspaces,
  } = useWorkspace();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "Loading" : "Loaded"}</div>
      <div data-testid="error">{error || "No error"}</div>
      <div data-testid="current-workspace">
        {currentWorkspace ? currentWorkspace.name : "No workspace"}
      </div>
      <div data-testid="workspace-count">{workspaces.length}</div>
      <button onClick={() => selectWorkspace(2)}>Select Workspace 2</button>
      <button
        onClick={async () => {
          try {
            await createWorkspace({
              name: "New Workspace",
              description: "New description",
            });
          } catch {
            // Error handled in context
          }
        }}
      >
        Create Workspace
      </button>
      <button
        onClick={async () => {
          try {
            await updateWorkspace(1, {
              name: "Updated",
              description: "Updated description",
            });
          } catch {
            // Error handled in context
          }
        }}
      >
        Update Workspace
      </button>
      <button
        onClick={async () => {
          try {
            await deleteWorkspace(1);
          } catch {
            // Error handled in context
          }
        }}
      >
        Delete Workspace
      </button>
      <button
        onClick={async () => {
          try {
            await refreshWorkspaces();
          } catch {
            // Error handled in context
          }
        }}
      >
        Refresh Workspaces
      </button>
    </div>
  );
}

describe("WorkspaceContext", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (workspaceApi.list as jest.Mock).mockResolvedValue(mockWorkspaces);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Provider Initialization", () => {
    it("should render children", async () => {
      render(
        <WorkspaceProvider>
          <div data-testid="child">Test Child</div>
        </WorkspaceProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should load workspaces on mount", async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      expect(workspaceApi.list).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("workspace-count")).toHaveTextContent("2");
    });

    it("should set initial loading state to true", () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      expect(screen.getByTestId("loading")).toHaveTextContent("Loading");
    });

    it("should handle loading errors", async () => {
      const errorMessage = "Failed to load workspaces";
      (workspaceApi.list as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
      });

      expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
    });

    it("should handle non-Error exceptions during load", async () => {
      (workspaceApi.list as jest.Mock).mockRejectedValueOnce("String error");

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Failed to load workspaces"
        );
      });
    });

    it("should handle empty workspace list", async () => {
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([]);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "No workspace"
        );
      });

      expect(screen.getByTestId("workspace-count")).toHaveTextContent("0");
    });
  });

  describe("LocalStorage Persistence", () => {
    it("should restore workspace from localStorage", async () => {
      localStorage.setItem("aqa-youtube-assistant:selected-workspace-id", "2");

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Test Workspace"
        );
      });
    });

    it("should default to workspace ID 1 if not in localStorage", async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Default Workspace"
        );
      });
    });

    it("should default to first workspace if saved ID not found", async () => {
      localStorage.setItem(
        "aqa-youtube-assistant:selected-workspace-id",
        "999"
      );

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Default Workspace"
        );
      });
    });

    it("should save selected workspace to localStorage", async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      act(() => {
        screen.getByText("Select Workspace 2").click();
      });

      await waitFor(() => {
        expect(
          localStorage.getItem("aqa-youtube-assistant:selected-workspace-id")
        ).toBe("2");
      });
    });
  });

  describe("selectWorkspace", () => {
    it("should update current workspace", async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      act(() => {
        screen.getByText("Select Workspace 2").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Test Workspace"
        );
      });
    });

    it("should save to localStorage when workspace changes", async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      act(() => {
        screen.getByText("Select Workspace 2").click();
      });

      await waitFor(() => {
        expect(
          localStorage.getItem("aqa-youtube-assistant:selected-workspace-id")
        ).toBe("2");
      });
    });

    it("should not update if workspace ID does not exist", async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Default Workspace"
        );
      });

      // Manually call selectWorkspace with non-existent ID
      const { result } = renderHookInProvider();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.selectWorkspace(999);
      });

      // Should remain on Default Workspace
      expect(result.current.currentWorkspace?.id).toBe(1);
    });
  });

  describe("createWorkspace", () => {
    it("should create a workspace and refresh list", async () => {
      const newWorkspace: Workspace = {
        id: 3,
        name: "New Workspace",
        description: "New description",
        created_at: "2025-10-23T00:00:00Z",
      };

      (workspaceApi.create as jest.Mock).mockResolvedValueOnce(newWorkspace);
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([
        ...mockWorkspaces,
        newWorkspace,
      ]);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      await act(async () => {
        screen.getByText("Create Workspace").click();
      });

      await waitFor(() => {
        expect(workspaceApi.create).toHaveBeenCalledWith({
          name: "New Workspace",
          description: "New description",
        });
      });

      expect(workspaceApi.list).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it("should handle create errors", async () => {
      const errorMessage = "Failed to create workspace";
      (workspaceApi.create as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      await act(async () => {
        screen.getByText("Create Workspace").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
      });
    });

    it("should handle non-Error exceptions during create", async () => {
      (workspaceApi.create as jest.Mock).mockRejectedValueOnce("String error");

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      await act(async () => {
        screen.getByText("Create Workspace").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Failed to create workspace"
        );
      });
    });
  });

  describe("updateWorkspace", () => {
    it("should update a workspace and refresh list", async () => {
      const updatedWorkspace: Workspace = {
        id: 1,
        name: "Updated",
        description: "Updated description",
        created_at: "2025-10-21T00:00:00Z",
      };

      (workspaceApi.update as jest.Mock).mockResolvedValueOnce(
        updatedWorkspace
      );
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([
        updatedWorkspace,
        mockWorkspaces[1],
      ]);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      await act(async () => {
        screen.getByText("Update Workspace").click();
      });

      await waitFor(() => {
        expect(workspaceApi.update).toHaveBeenCalledWith(1, {
          name: "Updated",
          description: "Updated description",
        });
      });

      expect(workspaceApi.list).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it("should handle update errors", async () => {
      const errorMessage = "Failed to update workspace";
      (workspaceApi.update as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      await act(async () => {
        screen.getByText("Update Workspace").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
      });
    });

    it("should handle non-Error exceptions during update", async () => {
      (workspaceApi.update as jest.Mock).mockRejectedValueOnce("String error");

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      await act(async () => {
        screen.getByText("Update Workspace").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Failed to update workspace"
        );
      });
    });
  });

  describe("deleteWorkspace", () => {
    it("should delete a workspace and refresh list", async () => {
      (workspaceApi.delete as jest.Mock).mockResolvedValueOnce({
        message: "Deleted",
      });
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([
        mockWorkspaces[1],
      ]);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      await act(async () => {
        screen.getByText("Delete Workspace").click();
      });

      await waitFor(() => {
        expect(workspaceApi.delete).toHaveBeenCalledWith(1);
      });

      expect(workspaceApi.list).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it("should select another workspace when deleting current workspace", async () => {
      // Ensure we start with Default Workspace selected
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Default Workspace"
        );
      });

      // Setup delete to succeed and return updated list
      (workspaceApi.delete as jest.Mock).mockResolvedValueOnce({
        message: "Deleted",
      });
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([
        mockWorkspaces[1],
      ]);

      await act(async () => {
        screen.getByText("Delete Workspace").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Test Workspace"
        );
      });
    });

    it("should set current workspace to null when deleting the last workspace", async () => {
      // Setup initial load with only one workspace
      const singleWorkspace: Workspace[] = [mockWorkspaces[0]];
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(singleWorkspace);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Default Workspace"
        );
      });

      // Setup delete to succeed and return empty list
      (workspaceApi.delete as jest.Mock).mockResolvedValueOnce({
        message: "Deleted",
      });
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([]);

      await act(async () => {
        screen.getByText("Delete Workspace").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "No workspace"
        );
      });
    });

    it("should not change current workspace when deleting a different workspace", async () => {
      // Setup initial load
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Default Workspace"
        );
      });

      // First, select workspace 2 (Test Workspace)
      await act(async () => {
        screen.getByText("Select Workspace 2").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Test Workspace"
        );
      });

      // Now delete workspace 1 (Default Workspace - NOT current)
      (workspaceApi.delete as jest.Mock).mockImplementationOnce(
        async (id: number) => {
          expect(id).toBe(1); // Verify we're deleting workspace 1
          return { message: "Deleted" };
        }
      );
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([
        mockWorkspaces[1], // Only workspace 2 remains
      ]);

      await act(async () => {
        screen.getByText("Delete Workspace").click();
      });

      // Current workspace should STILL be Test Workspace (not changed)
      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Test Workspace"
        );
      });
    });

    it("should handle delete errors", async () => {
      const errorMessage = "Failed to delete workspace";

      // Setup initial load
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      // Setup delete to fail
      (workspaceApi.delete as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      await act(async () => {
        screen.getByText("Delete Workspace").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
      });
    });

    it("should handle non-Error exceptions during delete", async () => {
      // Setup initial load
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      // Setup delete to fail with non-Error
      (workspaceApi.delete as jest.Mock).mockRejectedValueOnce("String error");

      await act(async () => {
        screen.getByText("Delete Workspace").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Failed to delete workspace"
        );
      });
    });
  });

  describe("refreshWorkspaces", () => {
    it("should refresh workspace list", async () => {
      // Setup initial load
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("workspace-count")).toHaveTextContent("2");
      });

      // Setup refresh to return updated list
      const updatedWorkspaces: Workspace[] = [
        ...mockWorkspaces,
        {
          id: 3,
          name: "New Workspace",
          description: "New workspace",
          created_at: "2025-10-23T00:00:00Z",
        },
      ];

      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(updatedWorkspaces);

      await act(async () => {
        screen.getByText("Refresh Workspaces").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("workspace-count")).toHaveTextContent("3");
      });
    });

    it("should update current workspace on refresh if it still exists", async () => {
      // Setup initial load
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Default Workspace"
        );
      });

      // Setup refresh with updated workspace - MUST be a different object
      const updatedWorkspace: Workspace = {
        id: 1,
        name: "Updated Default Workspace",
        description: "Updated description",
        created_at: "2025-01-01T00:00:00Z",
      };

      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([
        updatedWorkspace,
        mockWorkspaces[1],
      ]);

      await act(async () => {
        screen.getByText("Refresh Workspaces").click();
      });

      // Verify the workspace name was updated from the refreshed data
      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Updated Default Workspace"
        );
      });
    });

    it("should not update current workspace if it no longer exists after refresh", async () => {
      // Setup initial load
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("current-workspace")).toHaveTextContent(
          "Default Workspace"
        );
      });

      // Setup refresh without current workspace
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce([
        mockWorkspaces[1],
      ]);

      await act(async () => {
        screen.getByText("Refresh Workspaces").click();
      });

      // Current workspace should remain the same (not updated)
      await waitFor(() => {
        expect(screen.getByTestId("workspace-count")).toHaveTextContent("1");
      });

      // The workspace reference stays the same until manually changed
      expect(screen.getByTestId("current-workspace")).toHaveTextContent(
        "Default Workspace"
      );
    });

    it("should handle refresh errors", async () => {
      const errorMessage = "Failed to refresh workspaces";
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      (workspaceApi.list as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      await act(async () => {
        screen.getByText("Refresh Workspaces").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(errorMessage);
      });
    });

    it("should handle non-Error exceptions during refresh", async () => {
      (workspaceApi.list as jest.Mock).mockResolvedValueOnce(mockWorkspaces);

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loaded");
      });

      (workspaceApi.list as jest.Mock).mockRejectedValueOnce("String error");

      await act(async () => {
        screen.getByText("Refresh Workspaces").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Failed to refresh workspaces"
        );
      });
    });
  });

  describe("useWorkspace Hook", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      function ComponentOutsideProvider() {
        useWorkspace();
        return <div>Test</div>;
      }

      expect(() => render(<ComponentOutsideProvider />)).toThrow(
        "useWorkspace must be used within WorkspaceProvider"
      );

      consoleError.mockRestore();
    });
  });
});

// Helper function to render hook within provider
function renderHookInProvider() {
  const result: { current: ReturnType<typeof useWorkspace> | null } = {
    current: null,
  };

  function TestHookComponent() {
    result.current = useWorkspace();
    return null;
  }

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

  (workspaceApi.list as jest.Mock).mockResolvedValue(mockWorkspaces);

  render(
    <WorkspaceProvider>
      <TestHookComponent />
    </WorkspaceProvider>
  );

  return { result: result as { current: ReturnType<typeof useWorkspace> } };
}
