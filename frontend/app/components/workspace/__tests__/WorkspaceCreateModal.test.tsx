/**
 * Unit tests for WorkspaceCreateModal component
 * Tests form validation, submission, error handling, focus management, and accessibility
 */

import React from "react";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import WorkspaceCreateModal from "../WorkspaceCreateModal";
import { WorkspaceProvider } from "../../../contexts/WorkspaceContext";
import { workspaceApi } from "../../../lib/workspaceApi";
import { Workspace } from "../../../types/workspace";

// Mock workspace API
jest.mock("../../../lib/workspaceApi");

describe("WorkspaceCreateModal", () => {
  const mockOnClose = jest.fn();
  const mockWorkspaces: Workspace[] = [
    {
      id: 1,
      name: "Default Workspace",
      description: "Default workspace",
      created_at: "2025-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (workspaceApi.list as jest.Mock).mockResolvedValue(mockWorkspaces);
  });

  const renderWithProvider = () => {
    return render(
      <WorkspaceProvider>
        <WorkspaceCreateModal onClose={mockOnClose} />
      </WorkspaceProvider>
    );
  };

  describe("Rendering", () => {
    it("should render the modal", async () => {
      renderWithProvider();

      expect(screen.getByTestId("workspace-create-modal")).toBeInTheDocument();
    });

    it("should display modal title", async () => {
      renderWithProvider();

      expect(screen.getByText("Create Workspace")).toBeInTheDocument();
    });

    it("should render name input field", async () => {
      renderWithProvider();

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it("should render description textarea", async () => {
      renderWithProvider();

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it("should render Cancel button", async () => {
      renderWithProvider();

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should render Create button", async () => {
      renderWithProvider();

      expect(screen.getByRole("button", { name: /^create$/i })).toBeInTheDocument();
    });

    it("should render close button", async () => {
      renderWithProvider();

      expect(screen.getByRole("button", { name: /close modal/i })).toBeInTheDocument();
    });

    it("should show character counters", async () => {
      renderWithProvider();

      expect(screen.getByText("0/100 characters")).toBeInTheDocument();
      expect(screen.getByText("0/500 characters")).toBeInTheDocument();
    });

    it("should have proper ARIA attributes", async () => {
      renderWithProvider();

      const modal = screen.getByTestId("workspace-create-modal");
      expect(modal).toHaveAttribute("role", "dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
    });

    it("should mark name field as required", async () => {
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute("aria-required", "true");
    });
  });

  describe("Focus Management", () => {
    it("should focus name input on mount", async () => {
      renderWithProvider();

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        expect(nameInput).toHaveFocus();
      });
    });

    it("should trap focus within modal", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      const descInput = screen.getByLabelText(/description/i);
      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      const createBtn = screen.getByRole("button", { name: /^create$/i });
      const closeBtn = screen.getByRole("button", { name: /close modal/i });

      // Start with name input focused
      expect(nameInput).toHaveFocus();

      // Tab through elements
      await user.tab();
      expect(descInput).toHaveFocus();

      await user.tab();
      expect(cancelBtn).toHaveFocus();

      await user.tab();
      expect(createBtn).toHaveFocus();

      await user.tab();
      expect(closeBtn).toHaveFocus();

      // Should wrap back to first element
      await user.tab();
      expect(nameInput).toHaveFocus();
    });

    it("should shift+tab backwards through modal", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      const closeBtn = screen.getByRole("button", { name: /close modal/i });

      // Start with name input focused
      expect(nameInput).toHaveFocus();

      // Shift+Tab should wrap to last element
      await user.tab({ shift: true });
      expect(closeBtn).toHaveFocus();
    });
  });

  describe("Form Input", () => {
    it("should update name input value", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      await user.type(nameInput, "New Workspace");

      expect(nameInput.value).toBe("New Workspace");
    });

    it("should update description textarea value", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      await user.type(descInput, "Test description");

      expect(descInput.value).toBe("Test description");
    });

    it("should update character counter for name", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "Test");

      expect(screen.getByText("4/100 characters")).toBeInTheDocument();
    });

    it("should update character counter for description", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, "Test description");

      expect(screen.getByText("16/500 characters")).toBeInTheDocument();
    });

    it("should enforce maxLength on name input", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      const longText = "a".repeat(150);
      await user.type(nameInput, longText);

      expect(nameInput.value.length).toBe(100);
    });

    it("should enforce maxLength on description textarea", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      const longText = "a".repeat(600);
      await user.type(descInput, longText);

      expect(descInput.value.length).toBe(500);
    });
  });

  describe("Form Validation", () => {
    it("should show error when name is empty", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      expect(screen.getByText("Workspace name is required")).toBeInTheDocument();
    });

    it("should show error when name is only whitespace", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "   ");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      expect(screen.getByText("Workspace name is required")).toBeInTheDocument();
    });

    it("should mark name input as invalid when error", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute("aria-invalid", "true");
    });

    it("should associate error message with input", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute("aria-describedby", "error-message");
    });

    it("should clear error when user starts typing", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      expect(screen.getByText("Workspace name is required")).toBeInTheDocument();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New");

      // Submit again to trigger validation
      await user.click(createBtn);

      // Error should be different or gone
      expect(screen.queryByText("Workspace name is required")).not.toBeInTheDocument();
    });

    it("should show error when name exceeds 100 characters", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      const longName = "a".repeat(101); // 101 characters
      
      // Use fireEvent to directly set the value
      fireEvent.change(nameInput, { target: { value: longName } });

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      expect(
        screen.getByText("Workspace name must be 100 characters or less")
      ).toBeInTheDocument();
    });

    it("should show error when description exceeds 500 characters", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "Valid Name" } });

      const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      const longDescription = "a".repeat(501); // 501 characters
      fireEvent.change(descInput, { target: { value: longDescription } });

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      expect(
        screen.getByText("Description must be 500 characters or less")
      ).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call createWorkspace with name only", async () => {
      const user = userEvent.setup();
      const newWorkspace: Workspace = {
        id: 2,
        name: "New Workspace",
        description: "",
        created_at: "2025-01-02T00:00:00Z",
      };

      (workspaceApi.create as jest.Mock).mockResolvedValueOnce(newWorkspace);

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(workspaceApi.create).toHaveBeenCalledWith({
          name: "New Workspace",
          description: undefined,
        });
      });
    });

    it("should call createWorkspace with name and description", async () => {
      const user = userEvent.setup();
      const newWorkspace: Workspace = {
        id: 2,
        name: "New Workspace",
        description: "Test description",
        created_at: "2025-01-02T00:00:00Z",
      };

      (workspaceApi.create as jest.Mock).mockResolvedValueOnce(newWorkspace);

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, "Test description");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(workspaceApi.create).toHaveBeenCalledWith({
          name: "New Workspace",
          description: "Test description",
        });
      });
    });

    it("should trim whitespace from name", async () => {
      const user = userEvent.setup();
      const newWorkspace: Workspace = {
        id: 2,
        name: "New Workspace",
        description: "",
        created_at: "2025-01-02T00:00:00Z",
      };

      (workspaceApi.create as jest.Mock).mockResolvedValueOnce(newWorkspace);

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "  New Workspace  ");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(workspaceApi.create).toHaveBeenCalledWith({
          name: "New Workspace",
          description: undefined,
        });
      });
    });

    it("should trim whitespace from description", async () => {
      const user = userEvent.setup();
      const newWorkspace: Workspace = {
        id: 2,
        name: "New Workspace",
        description: "Test",
        created_at: "2025-01-02T00:00:00Z",
      };

      (workspaceApi.create as jest.Mock).mockResolvedValueOnce(newWorkspace);

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, "  Test  ");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(workspaceApi.create).toHaveBeenCalledWith({
          name: "New Workspace",
          description: "Test",
        });
      });
    });

    it("should call onClose after successful creation", async () => {
      const user = userEvent.setup();
      const newWorkspace: Workspace = {
        id: 2,
        name: "New Workspace",
        description: "",
        created_at: "2025-01-02T00:00:00Z",
      };

      (workspaceApi.create as jest.Mock).mockResolvedValueOnce(newWorkspace);

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      (workspaceApi.create as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      // Should show "Creating..." text
      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });

    it("should disable buttons during submission", async () => {
      const user = userEvent.setup();
      (workspaceApi.create as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      const cancelBtn = screen.getByRole("button", { name: /cancel/i });

      await user.click(createBtn);

      expect(createBtn).toBeDisabled();
      expect(cancelBtn).toBeDisabled();
    });

    it("should disable inputs during submission", async () => {
      const user = userEvent.setup();
      (workspaceApi.create as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      expect(nameInput).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should display API error message", async () => {
      const user = userEvent.setup();
      (workspaceApi.create as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to create workspace")
      );

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText("Failed to create workspace")).toBeInTheDocument();
      });
    });

    it("should show generic error for non-Error objects", async () => {
      const user = userEvent.setup();
      (workspaceApi.create as jest.Mock).mockRejectedValueOnce("String error");

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText("Failed to create workspace")).toBeInTheDocument();
      });
    });

    it("should not call onClose on error", async () => {
      const user = userEvent.setup();
      (workspaceApi.create as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to create workspace")
      );

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText("Failed to create workspace")).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should re-enable form after error", async () => {
      const user = userEvent.setup();
      (workspaceApi.create as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to create workspace")
      );

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText("Failed to create workspace")).toBeInTheDocument();
      });

      expect(createBtn).not.toBeDisabled();
      expect(nameInput).not.toBeDisabled();
    });

    it("should display error with role alert", async () => {
      const user = userEvent.setup();
      (workspaceApi.create as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to create workspace")
      );

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("Failed to create workspace");
      });
    });
  });

  describe("Modal Closing", () => {
    it("should call onClose when Cancel button clicked", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when close X button clicked", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const closeBtn = screen.getByRole("button", { name: /close modal/i });
      await user.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop clicked", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const backdrop = screen.getByTestId("workspace-create-modal");
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not close when clicking modal content", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const modalTitle = screen.getByText("Create Workspace");
      await user.click(modalTitle);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should call onClose when Escape key pressed", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Accessibility", () => {
    it("should have dialog role", async () => {
      renderWithProvider();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have aria-modal attribute", async () => {
      renderWithProvider();

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveAttribute("aria-modal", "true");
    });

    it("should label modal with title", async () => {
      renderWithProvider();

      const modal = screen.getByRole("dialog");
      expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
      expect(screen.getByText("Create Workspace")).toHaveAttribute("id", "modal-title");
    });

    it("should have proper form labels", async () => {
      renderWithProvider();

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it("should indicate required fields", async () => {
      renderWithProvider();

      const nameLabel = screen.getByText(/name/i, { selector: "label" });
      expect(within(nameLabel).getByLabelText("required")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty description as undefined", async () => {
      const user = userEvent.setup();
      const newWorkspace: Workspace = {
        id: 2,
        name: "New Workspace",
        description: "",
        created_at: "2025-01-02T00:00:00Z",
      };

      (workspaceApi.create as jest.Mock).mockResolvedValueOnce(newWorkspace);

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(workspaceApi.create).toHaveBeenCalledWith({
          name: "New Workspace",
          description: undefined,
        });
      });
    });

    it("should handle whitespace-only description as undefined", async () => {
      const user = userEvent.setup();
      const newWorkspace: Workspace = {
        id: 2,
        name: "New Workspace",
        description: "",
        created_at: "2025-01-02T00:00:00Z",
      };

      (workspaceApi.create as jest.Mock).mockResolvedValueOnce(newWorkspace);

      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace");

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, "   ");

      const createBtn = screen.getByRole("button", { name: /^create$/i });
      await user.click(createBtn);

      await waitFor(() => {
        expect(workspaceApi.create).toHaveBeenCalledWith({
          name: "New Workspace",
          description: undefined,
        });
      });
    });

    it("should prevent form submission via Enter key in single-line inputs", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "New Workspace{Enter}");

      // Should not have called createWorkspace (Enter was prevented)
      expect(workspaceApi.create).not.toHaveBeenCalled();
      
      // Modal should still be open (not closed)
      expect(screen.getByTestId("workspace-create-modal")).toBeInTheDocument();
    });
  });
});
