/**
 * Unit tests for Home page component
 * Tests page layout, ProjectContext integration, and component coordination
 *
 * Note: ProjectList, ProjectForm, and ProjectContext have their own comprehensive test suites.
 * These tests focus on page-level integration and layout.
 *
 * Related: Issue #15 - Integrate all project management components
 */

import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import Home from "../page";
import * as api from "../lib/api";
import { Project } from "../types/project";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the API module
jest.mock("../lib/api");

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Helper function to wait for ProjectList to finish loading
const waitForProjectListToLoad = async () => {
  await waitFor(() =>
    expect(screen.queryByLabelText("Loading projects")).not.toBeInTheDocument()
  );
};

describe("Home Page - Component Integration", () => {
  const mockProjects: Project[] = [
    {
      id: 1,
      name: "Test Project 1",
      description: "Test Description 1",
      status: "planned",
      created_at: "2025-10-15T10:00:00Z",
      updated_at: "2025-10-15T10:00:00Z",
    },
    {
      id: 2,
      name: "Test Project 2",
      description: "Test Description 2",
      status: "in_progress",
      created_at: "2025-10-16T11:00:00Z",
      updated_at: "2025-10-16T11:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockReset();
    localStorageMock.clear();
    (api.getProjects as jest.Mock).mockResolvedValue(mockProjects);
    (api.getProject as jest.Mock).mockImplementation((id: number) => {
      const project = mockProjects.find((p) => p.id === id);
      return project
        ? Promise.resolve(project)
        : Promise.reject(new Error("Project not found"));
    });
    (api.deleteProject as jest.Mock).mockResolvedValue(undefined);
  });

  describe("Page Layout", () => {
    it("should render page title and description", async () => {
      render(<Home />);

      expect(
        screen.getByRole("heading", { name: "YouTube Assistant", level: 1 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Helper for planning and making YouTube videos/)
      ).toBeInTheDocument();

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should render create project section with heading", async () => {
      render(<Home />);

      expect(
        screen.getByRole("heading", { name: "Create New Project", level: 2 })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create new project" })
      ).toBeInTheDocument();

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should render projects section with heading", async () => {
      render(<Home />);

      expect(
        screen.getByRole("heading", { name: "Your Projects", level: 2 })
      ).toBeInTheDocument();

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should use semantic HTML structure", async () => {
      const { container } = render(<Home />);

      expect(container.querySelector("main")).toBeInTheDocument();
      expect(container.querySelector("header")).toBeInTheDocument();
      expect(container.querySelectorAll("section")).toHaveLength(2); // Create + Projects sections

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });
  });

  describe("ProjectForm Integration", () => {
    it("should show create button by default", async () => {
      render(<Home />);

      expect(
        screen.getByRole("button", { name: "Create new project" })
      ).toBeInTheDocument();

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should show ProjectForm when create button is clicked", async () => {
      render(<Home />);

      // Wait for ProjectList to finish loading first
      await waitForProjectListToLoad();

      const createButton = screen.getByRole("button", {
        name: "Create new project",
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        // ProjectForm should be rendered (it contains form element)
        expect(
          screen.queryByRole("button", { name: "Create new project" })
        ).not.toBeInTheDocument();
      });
    });

    it("should hide ProjectForm when cancel is clicked", async () => {
      render(<Home />);

      // Wait for ProjectList to finish loading first
      await waitForProjectListToLoad();

      // Open form
      const createButton = screen.getByRole("button", {
        name: "Create new project",
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: "Create new project" })
        ).not.toBeInTheDocument();
      });

      // Close form - find cancel button in the form
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Create new project" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("ProjectList Integration", () => {
    it("should render ProjectList component", async () => {
      render(<Home />);

      await waitFor(() => {
        expect(api.getProjects).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
        expect(screen.getByText("Test Project 2")).toBeInTheDocument();
      });
    });

    it("should refresh ProjectList after project creation", async () => {
      (api.createProject as jest.Mock).mockResolvedValue({
        id: 3,
        name: "New Project",
        description: "New Description",
        status: "planned",
        created_at: "2025-10-20T10:00:00Z",
        updated_at: "2025-10-20T10:00:00Z",
      });

      render(<Home />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
      });

      // Open form
      const createButton = screen.getByRole("button", {
        name: "Create new project",
      });
      fireEvent.click(createButton);

      // Fill and submit form
      await waitFor(() => {
        expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const submitButton = screen.getByRole("button", {
        name: /create project/i,
      });

      fireEvent.change(nameInput, { target: { value: "New Project" } });
      fireEvent.change(descriptionInput, {
        target: { value: "New Description" },
      });

      // Mock second call to getProjects to return updated list
      (api.getProjects as jest.Mock).mockResolvedValueOnce([
        ...mockProjects,
        {
          id: 3,
          name: "New Project",
          description: "New Description",
          status: "planned",
          created_at: "2025-10-20T10:00:00Z",
          updated_at: "2025-10-20T10:00:00Z",
        },
      ]);

      fireEvent.click(submitButton);

      // Form should close after 1500ms delay
      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: "Create new project" })
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // List should refresh after form closes
      await waitFor(() => {
        expect(api.getProjects).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("ProjectContext Integration", () => {
    it("should not show current project indicator when no project selected", async () => {
      render(<Home />);

      expect(screen.queryByText("Working on:")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Clear project selection" })
      ).not.toBeInTheDocument();

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should show current project indicator when project is selected", async () => {
      // Simulate project already selected in localStorage
      localStorageMock.setItem("currentProjectId", "1");

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Working on:")).toBeInTheDocument();
        // Use more specific selector - get the indicator div's strong element
        const indicator = screen.getByRole("status", {
          name: "Current project",
        });
        expect(indicator).toHaveTextContent("Test Project 1");
        expect(
          screen.getByRole("button", { name: "Clear project selection" })
        ).toBeInTheDocument();
      });
    });

    it("should hide current project indicator when clear button is clicked", async () => {
      localStorageMock.setItem("currentProjectId", "1");

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Working on:")).toBeInTheDocument();
      });

      const clearButton = screen.getByRole("button", {
        name: "Clear project selection",
      });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByText("Working on:")).not.toBeInTheDocument();
      });
    });

    it("should show selected project name in header", async () => {
      localStorageMock.setItem("currentProjectId", "2");

      render(<Home />);

      await waitFor(() => {
        const header = screen.getByRole("banner");
        expect(within(header).getByText("Test Project 2")).toBeInTheDocument();
      });
    });

    it("should persist selection after project is selected", async () => {
      render(<Home />);

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
      });

      // Click on first project card to select it
      const projectCard = screen
        .getByText("Test Project 1")
        .closest('div[role="button"]');
      fireEvent.click(projectCard!);

      // Wait for getProject API call to complete and indicator to show
      await waitFor(
        async () => {
          expect(api.getProject).toHaveBeenCalledWith(1);
          expect(screen.getByText("Working on:")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify the indicator shows the correct project
      const indicator = screen.getByRole("status", { name: "Current project" });
      expect(indicator).toHaveTextContent("Test Project 1");
    });
  });

  describe("Project Deletion Flow", () => {
    it("should refresh list after project is deleted", async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
        expect(screen.getByText("Test Project 2")).toBeInTheDocument();
      });

      // Mock updated project list after deletion
      (api.getProjects as jest.Mock).mockResolvedValueOnce([mockProjects[1]]);

      // Delete first project - click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal and click confirm
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(api.deleteProject).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(api.getProjects).toHaveBeenCalledTimes(2);
      });
    });

    it("should clear selection if deleted project was selected", async () => {
      localStorageMock.setItem("currentProjectId", "1");

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Working on:")).toBeInTheDocument();
      });

      // Mock updated list after deletion
      (api.getProjects as jest.Mock).mockResolvedValueOnce([mockProjects[1]]);

      // Delete the selected project - click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal and click confirm
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(api.deleteProject).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(screen.queryByText("Working on:")).not.toBeInTheDocument();
      });
    });

    it("should not clear selection if different project was deleted", async () => {
      localStorageMock.setItem("currentProjectId", "1");

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText("Working on:")).toBeInTheDocument();
      });

      // Mock updated list after deletion
      (api.getProjects as jest.Mock).mockResolvedValueOnce([mockProjects[0]]);

      // Delete the non-selected project - click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 2/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal and click confirm
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 2/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(api.deleteProject).toHaveBeenCalledWith(2);
      });

      // Selection should remain
      await waitFor(() => {
        expect(screen.getByText("Working on:")).toBeInTheDocument();
        expect(
          within(screen.getByRole("banner")).getByText("Test Project 1")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible header section with proper ARIA labels", async () => {
      localStorageMock.setItem("currentProjectId", "1");

      render(<Home />);

      await waitFor(() => {
        const currentProjectStatus = screen.getByRole("status", {
          name: "Current project",
        });
        expect(currentProjectStatus).toBeInTheDocument();
      });

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should have accessible create button", async () => {
      render(<Home />);

      const createButton = screen.getByRole("button", {
        name: "Create new project",
      });
      expect(createButton).toHaveAccessibleName();

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should have accessible clear selection button", async () => {
      localStorageMock.setItem("currentProjectId", "1");

      render(<Home />);

      await waitFor(() => {
        const clearButton = screen.getByRole("button", {
          name: "Clear project selection",
        });
        expect(clearButton).toHaveAccessibleName();
      });

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should have proper heading hierarchy", async () => {
      const { container } = render(<Home />);

      const h1 = container.querySelector("h1");
      const h2s = container.querySelectorAll("h2");

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThanOrEqual(2);

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });
  });

  describe("Responsive Design", () => {
    it("should apply responsive container classes", async () => {
      const { container } = render(<Home />);

      const main = container.querySelector("main");
      expect(main).toHaveClass("max-w-6xl", "mx-auto");

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });

    it("should apply responsive padding classes", async () => {
      const { container } = render(<Home />);

      const wrapper = container.querySelector('[class*="min-h-screen"]');
      expect(wrapper).toHaveClass("p-8", "sm:p-20");

      // Wait for ProjectList to finish loading to prevent act() warnings
      await waitForProjectListToLoad();
    });
  });
});
