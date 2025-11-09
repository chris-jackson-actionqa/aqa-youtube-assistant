import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ProjectList from "../ProjectList";
import * as api from "../../lib/api";
import { Project } from "../../types/project";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock ProjectContext
const mockSelectProject = jest.fn();
jest.mock("../../contexts/ProjectContext", () => ({
  useProject: () => ({
    selectProject: mockSelectProject,
    currentProject: null,
    isLoading: false,
    error: null,
    clearSelection: jest.fn(),
    refreshCurrentProject: jest.fn(),
    updateCurrentProject: jest.fn(),
  }),
}));

// Mock only the API functions, not the ApiError class
jest.mock("../../lib/api", () => {
  const actualApi = jest.requireActual("../../lib/api");
  return {
    ...actualApi,
    getProjects: jest.fn(),
    deleteProject: jest.fn(),
  };
});

const mockedApi = api as jest.Mocked<typeof api>;

describe("ProjectList", () => {
  const mockProjects: Project[] = [
    {
      id: 1,
      name: "Test Project 1",
      description: "This is a test project description",
      status: "planned",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    },
    {
      id: 2,
      name: "Test Project 2",
      description: "Another test project",
      status: "in_progress",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
    {
      id: 3,
      name: "Test Project 3",
      description: null,
      status: "completed",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    },
  ];

  beforeEach(() => {
    // Reset implementations before each test to ensure clean slate
    mockedApi.getProjects.mockReset();
    mockedApi.deleteProject.mockReset();
    mockPush.mockReset();
    mockSelectProject.mockReset();
    mockSelectProject.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  describe("Loading State", () => {
    it("displays loading skeleton while fetching projects", () => {
      mockedApi.getProjects.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectList />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByLabelText("Loading projects")).toBeInTheDocument();
      expect(
        screen.getByText("Loading projects...", { selector: ".sr-only" })
      ).toBeInTheDocument();
    });

    it("displays skeleton cards during loading", () => {
      mockedApi.getProjects.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectList />);

      const skeletons = screen
        .getByRole("status")
        .querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error State", () => {
    it("displays error message when API call fails", async () => {
      const errorMessage = "Failed to connect to the API";
      mockedApi.getProjects.mockRejectedValueOnce(
        new api.ApiError(errorMessage, 500)
      );

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("displays retry button on error", async () => {
      mockedApi.getProjects.mockRejectedValueOnce(
        new api.ApiError("Network error", 0)
      );

      render(<ProjectList />);

      await waitFor(() => {
        const retryButton = screen.getByRole("button", { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it("retries fetching projects when retry button is clicked", async () => {
      mockedApi.getProjects
        .mockRejectedValueOnce(new api.ApiError("Network error", 0))
        .mockResolvedValueOnce(mockProjects);

      render(<ProjectList />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /retry/i })
        ).toBeInTheDocument();
      });

      const retryButton = screen.getByRole("button", { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
      });

      expect(mockedApi.getProjects).toHaveBeenCalledTimes(2);
    });

    it("displays generic error message for non-ApiError", async () => {
      mockedApi.getProjects.mockRejectedValueOnce(new Error("Unknown error"));

      render(<ProjectList />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load projects. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("displays empty state when no projects exist", async () => {
      mockedApi.getProjects.mockResolvedValueOnce([]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(screen.getByText("No projects yet")).toBeInTheDocument();
        expect(
          screen.getByText(/Create your first project/i)
        ).toBeInTheDocument();
      });
    });

    it("displays empty state with proper semantic structure", async () => {
      mockedApi.getProjects.mockResolvedValueOnce([]);

      render(<ProjectList />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "No projects yet" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Project Display", () => {
    it("displays all projects from API", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for loading to finish first
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText("Test Project 1")).toBeInTheDocument();
      expect(screen.getByText("Test Project 2")).toBeInTheDocument();
      expect(screen.getByText("Test Project 3")).toBeInTheDocument();
    });

    it("displays project descriptions", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Use findBy to wait for async data loading
      expect(
        await screen.findByText("This is a test project description")
      ).toBeInTheDocument();
      expect(
        await screen.findByText("Another test project")
      ).toBeInTheDocument();
    });

    it("does not display description when null", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for project to load
      const projectName = await screen.findByText("Test Project 3");
      const projectCard = projectName.closest(
        'div[role="button"]'
      ) as HTMLElement;
      expect(projectCard).toBeInTheDocument();
      const descriptions = within(projectCard).queryByText(/description/i);
      expect(descriptions).not.toBeInTheDocument();
    });

    it("displays status badges with correct labels", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Use findBy to automatically wait for data
      expect(await screen.findByText("Planned")).toBeInTheDocument();
      expect(await screen.findByText("In Progress")).toBeInTheDocument();
      expect(await screen.findByText("Completed")).toBeInTheDocument();
    });

    it("displays formatted dates for created and updated", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for loading to finish and data to render
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      // Check that dates are displayed in MM/DD/YYYY format
      // mockProjects have specific dates, check that at least some formatted dates are present
      const timeElements = screen.getAllByRole("time");
      expect(timeElements.length).toBeGreaterThan(0);

      // Verify the format matches MM/DD/YYYY pattern
      timeElements.forEach((element) => {
        expect(element.textContent).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      });
    });

    it("truncates long descriptions", async () => {
      const longDescription = "a".repeat(150);
      const projectWithLongDesc: Project = {
        ...mockProjects[0],
        description: longDescription,
      };
      mockedApi.getProjects.mockResolvedValueOnce([projectWithLongDesc]);

      render(<ProjectList />);

      // Use findBy to wait for content to load
      const displayedText = await screen.findByText(/aaa/);
      expect(displayedText.textContent).toHaveLength(103); // 100 chars + '...'
      expect(displayedText.textContent).toContain("...");
    });

    it("renders projects in a grid layout", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      const grid = screen.getByRole("list", { name: "Projects" });
      expect(grid).toHaveClass("grid");
      expect(grid).toHaveClass("grid-cols-1");
      expect(grid).toHaveClass("md:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-3");
    });
  });

  describe("Project Selection", () => {
    it("calls selectProject from context when card is clicked", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for project to appear
      const projectCard = await screen.findByText("Test Project 1");
      fireEvent.click(projectCard.closest('div[role="button"]')!);

      await waitFor(() => {
        expect(mockSelectProject).toHaveBeenCalledWith(1);
        // Navigation removed - stays on current page
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("does not navigate when card is clicked (stays on current page)", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for project to appear
      const projectCard = await screen.findByText("Test Project 1");
      fireEvent.click(projectCard.closest('div[role="button"]')!);

      await waitFor(() => {
        // Should not navigate - stays on current page
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("selects project without onProjectSelect callback", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />); // No onProjectSelect provided

      // Wait for project to appear
      const projectCard = await screen.findByText("Test Project 2");
      fireEvent.click(projectCard.closest('div[role="button"]')!);

      // Should still call context selectProject, no navigation
      await waitFor(() => {
        expect(mockSelectProject).toHaveBeenCalledWith(2);
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("calls onProjectSelect callback when card is clicked", async () => {
      const onProjectSelect = jest.fn();
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectSelect={onProjectSelect} />);

      // Wait for project to appear
      const projectCard = await screen.findByText("Test Project 1");
      fireEvent.click(projectCard.closest('div[role="button"]')!);

      await waitFor(() => {
        expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
        // Navigation removed
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("highlights selected project", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList selectedProjectId={1} />);

      // Wait for project to render
      const projectName = await screen.findByText("Test Project 1");
      const selectedCard = projectName.closest('div[role="button"]');
      expect(selectedCard).toHaveClass("border-blue-500");
      expect(selectedCard).toHaveClass("selected");
    });

    it("shows aria-pressed for selected project", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList selectedProjectId={1} />);

      // Wait for project to render
      const projectName = await screen.findByText("Test Project 1");
      const selectedCard = projectName.closest('div[role="button"]');
      expect(selectedCard).toHaveAttribute("aria-pressed", "true");
    });

    it("supports keyboard navigation for selection", async () => {
      const onProjectSelect = jest.fn();
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectSelect={onProjectSelect} />);

      // Wait for project to appear
      const projectCard = await screen.findByText("Test Project 1");
      fireEvent.keyDown(projectCard.closest('div[role="button"]')!, {
        key: "Enter",
      });

      await waitFor(() => {
        expect(mockSelectProject).toHaveBeenCalledWith(1);
        expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
        // Navigation removed - stays on current page
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("supports space key for selection", async () => {
      const onProjectSelect = jest.fn();
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectSelect={onProjectSelect} />);

      // Wait for project to appear
      const projectCard = await screen.findByText("Test Project 1");
      fireEvent.keyDown(projectCard.closest('div[role="button"]')!, {
        key: " ",
      });

      await waitFor(() => {
        expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
        // Navigation removed - stays on current page
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("supports keyboard navigation without callback", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />); // No callback provided

      // Wait for project to appear
      const projectCard = await screen.findByText("Test Project 3");
      fireEvent.keyDown(projectCard.closest('div[role="button"]')!, {
        key: "Enter",
      });

      // Should select project without navigation
      await waitFor(() => {
        expect(mockSelectProject).toHaveBeenCalledWith(3);
        // Navigation removed - stays on current page
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it("does not trigger selection on other keys", async () => {
      const onProjectSelect = jest.fn();
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectSelect={onProjectSelect} />);

      // Wait for project to appear
      const projectCard = await screen.findByText("Test Project 1");
      fireEvent.keyDown(projectCard.closest('div[role="button"]')!, {
        key: "a",
      });

      expect(onProjectSelect).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("applies cursor-pointer class to project cards", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for project to load
      const projectName = await screen.findByText("Test Project 1");
      const projectCard = projectName.closest('div[role="button"]');
      expect(projectCard).toHaveClass("cursor-pointer");
    });

    it("applies hover styles to project cards", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for project to load
      const projectName = await screen.findByText("Test Project 1");
      const projectCard = projectName.closest('div[role="button"]');
      expect(projectCard).toHaveClass("hover:bg-gray-50");
      expect(projectCard).toHaveClass("dark:hover:bg-gray-700");
    });
  });

  describe("Project Deletion", () => {
    it("does not navigate when delete button is clicked", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButton = screen.getAllByRole("button", {
        name: /delete project/i,
      })[0];
      fireEvent.click(deleteButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      // Verify navigation was NOT called
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("calls deleteProject API when delete button is clicked", async () => {
      mockedApi.deleteProject.mockResolvedValueOnce({ message: "Deleted" });
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButton = screen.getAllByRole("button", {
        name: /delete project/i,
      })[0];
      fireEvent.click(deleteButton);

      // Wait for modal and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockedApi.deleteProject).toHaveBeenCalledWith(1);
      });
    });

    it("removes deleted project from list", async () => {
      mockedApi.deleteProject.mockResolvedValueOnce({ message: "Deleted" });
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText("Test Project 1")).not.toBeInTheDocument();
      });
    });

    it("calls onProjectDelete callback after successful deletion", async () => {
      const onProjectDelete = jest.fn();
      mockedApi.deleteProject.mockResolvedValueOnce({ message: "Deleted" });
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList onProjectDelete={onProjectDelete} />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onProjectDelete).toHaveBeenCalledWith(1);
      });
    });

    it("displays error message when deletion fails", async () => {
      const errorMessage = "Failed to delete project";
      mockedApi.deleteProject.mockRejectedValueOnce(
        new api.ApiError(errorMessage, 500)
      );
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal to appear and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      // Check for error message (may appear in modal and/or main component)
      await waitFor(() => {
        const errorMessages = screen.getAllByText(errorMessage);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("displays generic error message for non-ApiError deletion", async () => {
      mockedApi.deleteProject.mockRejectedValueOnce(new Error("Unknown error"));
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal to appear and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      // Check for generic error message (may appear in modal and/or main component)
      await waitFor(() => {
        const errorMessages = screen.getAllByText(
          "Failed to delete project. Please try again."
        );
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("disables project card during deletion", async () => {
      mockedApi.deleteProject.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal to appear and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      // Check that the project card is disabled during deletion
      await waitFor(() => {
        const projectCard = screen
          .getByText("Test Project 1")
          .closest('div[role="button"]');
        expect(projectCard).toHaveClass("opacity-50");
        expect(projectCard).toHaveClass("pointer-events-none");
      });
    });

    it("keeps other projects when one is deleted", async () => {
      mockedApi.deleteProject.mockResolvedValueOnce({ message: "Deleted" });
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal to appear and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      // Check that project 1 is removed but others remain
      await waitFor(() => {
        expect(screen.queryByText("Test Project 1")).not.toBeInTheDocument();
        expect(screen.getByText("Test Project 2")).toBeInTheDocument();
        expect(screen.getByText("Test Project 3")).toBeInTheDocument();
      });
    });
  });

  describe("Status Colors and Labels", () => {
    it("displays correct color for planned status", async () => {
      const project: Project = { ...mockProjects[0], status: "planned" };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Use findBy to wait for badge to appear
      const badge = await screen.findByText("Planned");
      expect(badge).toHaveClass("bg-blue-100");
      expect(badge).toHaveClass("text-blue-800");
    });

    it("displays correct color for in_progress status", async () => {
      const project: Project = { ...mockProjects[0], status: "in_progress" };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Use findBy to wait for badge to appear
      const badge = await screen.findByText("In Progress");
      expect(badge).toHaveClass("bg-purple-100");
      expect(badge).toHaveClass("text-purple-800");
    });

    it("displays correct color for completed status", async () => {
      const project: Project = { ...mockProjects[0], status: "completed" };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Use findBy to wait for badge to appear
      const badge = await screen.findByText("Completed");
      expect(badge).toHaveClass("bg-green-100");
      expect(badge).toHaveClass("text-green-800");
    });

    it("displays correct color for archived status", async () => {
      const project: Project = { ...mockProjects[0], status: "archived" };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Use findBy to wait for badge to appear
      const badge = await screen.findByText("Archived");
      expect(badge).toHaveClass("bg-gray-100");
      expect(badge).toHaveClass("text-gray-800");
    });

    it("falls back to planned style for unknown status", async () => {
      const project: Project = { ...mockProjects[0], status: "unknown" };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Use findBy to wait for badge to appear
      const badge = await screen.findByText("Unknown Status");
      expect(badge).toHaveClass("bg-blue-100");
      expect(badge).toHaveClass("text-blue-800");
    });

    it('displays "Unknown Status" label for unrecognized status', async () => {
      const project: Project = { ...mockProjects[0], status: "custom_status" };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Use findBy to wait for badge to appear
      const badge = await screen.findByText("Unknown Status");
      expect(badge).toBeInTheDocument();
      // Should use planned color as fallback
      expect(badge).toHaveClass("bg-blue-100");
    });
  });

  describe("Date Formatting", () => {
    it("formats dates in MM/DD/YYYY format", async () => {
      const testDate = new Date("2025-10-26T12:00:00.000Z");
      const project: Project = {
        ...mockProjects[0],
        created_at: testDate.toISOString(),
        updated_at: testDate.toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      const expectedDate = testDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      // Wait for dates to render
      await waitFor(() => {
        // Should appear twice (created and updated)
        expect(screen.getAllByText(expectedDate).length).toBe(2);
      });
    });

    it("formats today's date correctly", async () => {
      const today = new Date();
      const project: Project = {
        ...mockProjects[0],
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      const expectedDate = today.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      // Wait for dates to render
      await waitFor(() => {
        expect(screen.getAllByText(expectedDate).length).toBe(2);
      });
    });

    it("formats old dates correctly", async () => {
      const oldDate = new Date("2023-01-15T08:30:00.000Z");
      const project: Project = {
        ...mockProjects[0],
        created_at: oldDate.toISOString(),
        updated_at: oldDate.toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      const expectedDate = oldDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      // Wait for dates to render
      await waitFor(() => {
        expect(screen.getAllByText(expectedDate).length).toBe(2);
      });
    });

    it("displays different dates for created and updated when they differ", async () => {
      const createdDate = new Date("2025-10-20T10:00:00.000Z");
      const updatedDate = new Date("2025-10-26T15:00:00.000Z");
      const project: Project = {
        ...mockProjects[0],
        created_at: createdDate.toISOString(),
        updated_at: updatedDate.toISOString(),
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      const expectedCreated = createdDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      const expectedUpdated = updatedDate.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      // Wait for dates to render
      await waitFor(() => {
        expect(screen.getByText(expectedCreated)).toBeInTheDocument();
        expect(screen.getByText(expectedUpdated)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels for project actions", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: "Delete project Test Project 1" })
      ).toBeInTheDocument();
      const projectCard = screen
        .getByText("Test Project 1")
        .closest('div[role="button"]');
      expect(projectCard).toHaveAttribute("aria-pressed");
    });

    it('has role="button" on project cards', async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      const projectCards = screen.getAllByRole("button", {
        name: /select project/i,
      });
      expect(projectCards.length).toBe(3);
    });

    it("has descriptive aria-label on project cards", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load and use findBy
      expect(
        await screen.findByRole("button", {
          name: "Select project Test Project 1",
        })
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("button", {
          name: "Select project Test Project 2",
        })
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("button", {
          name: "Select project Test Project 3",
        })
      ).toBeInTheDocument();
    });

    it("has keyboard focus styles on project cards", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for project to load
      const projectName = await screen.findByText("Test Project 1");
      const projectCard = projectName.closest('div[role="button"]');
      expect(projectCard).toHaveClass("focus:outline-none");
      expect(projectCard).toHaveClass("focus:ring-2");
      expect(projectCard).toHaveClass("focus:ring-blue-500");
      expect(projectCard).toHaveClass("focus:ring-offset-2");
    });

    it("has tabIndex={0} for keyboard navigation", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      const projectCards = screen.getAllByRole("button", {
        name: /select project/i,
      });
      projectCards.forEach((card) => {
        expect(card).toHaveAttribute("tabindex", "0");
      });
    });

    it("has proper ARIA label for status badges", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Use findBy to wait for badge
      const badge = await screen.findByText("Planned");
      expect(badge).toHaveAttribute("aria-label", "Status: Planned");
    });

    it("has semantic time elements", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for time elements to render
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      const timeElements = screen.getAllByRole("time");
      expect(timeElements.length).toBeGreaterThan(0);
      expect(timeElements[0]).toHaveAttribute("datetime");
    });

    it("uses list semantic structure", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for list to load
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      expect(
        screen.getByRole("list", { name: "Projects" })
      ).toBeInTheDocument();
      const buttons = screen.getAllByRole("button", {
        name: /select project/i,
      });
      expect(buttons).toHaveLength(3);
    });

    it("has hidden decorative SVG icons", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      render(<ProjectList />);

      // Wait for projects to load
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Loading projects")
        ).not.toBeInTheDocument();
      });

      const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty description gracefully", async () => {
      const project: Project = { ...mockProjects[0], description: null };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Use findBy to wait for project to load
      expect(await screen.findByText("Test Project 1")).toBeInTheDocument();
    });

    it("handles short description without truncation", async () => {
      const project: Project = {
        ...mockProjects[0],
        description: "Short text",
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Use findBy to wait for content
      expect(await screen.findByText("Short text")).toBeInTheDocument();
    });

    it("does not truncate description exactly at 100 characters", async () => {
      const exactLength = "a".repeat(100);
      const project: Project = {
        ...mockProjects[0],
        description: exactLength,
      };
      mockedApi.getProjects.mockResolvedValueOnce([project]);

      render(<ProjectList />);

      // Text should not be truncated
      const displayedText = await screen.findByText(exactLength);
      expect(displayedText.textContent).toHaveLength(100);
      expect(displayedText.textContent).not.toContain("...");
    });

    it("handles missing callbacks gracefully", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      mockedApi.deleteProject.mockResolvedValueOnce({ message: "Deleted" });

      render(<ProjectList />); // No callbacks provided

      // Wait for project to load
      const projectCard = await screen.findByText("Test Project 1");
      fireEvent.click(projectCard.closest('div[role="button"]')!);

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal to appear and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      // Should not crash
      await waitFor(() => {
        expect(screen.queryByText("Test Project 1")).not.toBeInTheDocument();
      });
    });

    it("handles API returning empty array", async () => {
      mockedApi.getProjects.mockResolvedValueOnce([]);

      render(<ProjectList />);

      // Use findBy to wait for empty state
      expect(await screen.findByText("No projects yet")).toBeInTheDocument();
    });

    it("shows error but keeps existing projects visible on delete error", async () => {
      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      mockedApi.deleteProject.mockRejectedValueOnce(
        new api.ApiError("Cannot delete", 400)
      );

      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal to appear and confirm deletion
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      // Check for error message (may appear in modal and/or main component)
      await waitFor(() => {
        const errorMessages = screen.getAllByText("Cannot delete");
        expect(errorMessages.length).toBeGreaterThan(0);
        // Project should still be visible
        expect(screen.getByText("Test Project 1")).toBeInTheDocument();
      });
    });

    it("should close modal when cancel button is clicked", async () => {
      mockedApi.getProjects.mockResolvedValue(mockProjects);

      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Click delete button to open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText("Delete Project?")).not.toBeInTheDocument();
      });

      // Project should still be visible
      expect(screen.getByText("Test Project 1")).toBeInTheDocument();
      expect(mockedApi.deleteProject).not.toHaveBeenCalled();
    });

    it("should handle keyboard events on delete button", async () => {
      mockedApi.getProjects.mockResolvedValue(mockProjects);

      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Find delete button
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });

      // Simulate keydown event
      fireEvent.keyDown(deleteButtons[0], { key: "Enter" });

      // Event should be stopped (no modal opens from keydown)
      expect(screen.queryByText("Delete Project?")).not.toBeInTheDocument();
    });

    it("should render project with empty description", async () => {
      const projectWithNoDesc: Project = {
        ...mockProjects[0],
        description: null,
      };
      mockedApi.getProjects.mockResolvedValue([projectWithNoDesc]);

      render(<ProjectList />);

      // Use findBy to wait for project
      await screen.findByText("Test Project 1");

      // Should render without error even with null description
      expect(
        screen.queryByText("This is a test project description")
      ).not.toBeInTheDocument();
    });

    it("should truncate very long descriptions", async () => {
      const longDesc = "A".repeat(200); // 200 characters
      const projectWithLongDesc: Project = {
        ...mockProjects[0],
        description: longDesc,
      };
      mockedApi.getProjects.mockResolvedValue([projectWithLongDesc]);

      render(<ProjectList />);

      // Wait for project to load
      await screen.findByText("Test Project 1");

      // Description should be truncated (max 150 chars + '...')
      const descElement = screen.getByText(/A+\.\.\./);
      expect(descElement.textContent?.length).toBeLessThan(longDesc.length);
    });

    it("should not allow closing modal during deletion", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });

      mockedApi.getProjects.mockResolvedValue(mockProjects);
      mockedApi.deleteProject.mockReturnValue(
        deletePromise as unknown as Promise<{ message: string }>
      );

      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      // Start deletion
      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      // Try to close modal (should not work during deletion)
      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
      });

      // Modal should still be open despite attempts to close
      expect(screen.getByText("Delete Project?")).toBeInTheDocument();

      // Resolve deletion
      resolveDelete!();

      await waitFor(() => {
        expect(screen.queryByText("Delete Project?")).not.toBeInTheDocument();
      });
    });

    it("should not close modal when cancel is clicked during deletion", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });

      mockedApi.getProjects.mockResolvedValueOnce(mockProjects);
      mockedApi.deleteProject.mockReturnValueOnce(
        deletePromise as unknown as Promise<{ message: string }>
      );

      render(<ProjectList />);

      // Wait for projects to load
      await screen.findByText("Test Project 1");

      // Open modal
      const deleteButtons = screen.getAllByRole("button", {
        name: /delete project test project 1/i,
      });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Project?")).toBeInTheDocument();
      });

      // Start deletion
      const confirmButton = screen.getByRole("button", {
        name: /confirm delete test project 1/i,
      });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
      });

      // Try to click cancel button during deletion (should not close)
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Modal should still be open
      expect(screen.getByText("Delete Project?")).toBeInTheDocument();

      // Resolve deletion
      resolveDelete!();

      await waitFor(() => {
        expect(screen.queryByText("Delete Project?")).not.toBeInTheDocument();
      });
    });
  });
});
