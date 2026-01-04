/**
 * Unit tests for ProjectDeleteConfirmation component
 *
 * Tests cover:
 * - Modal rendering and visibility
 * - User interactions (click, keyboard)
 * - API integration and error handling
 * - Accessibility features
 * - Focus management and focus trap
 *
 * Target: 100% code coverage
 * Related: Issue #13
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ProjectDeleteConfirmation from "../ProjectDeleteConfirmation";
import { Project } from "../../types/project";
import { ERROR_MESSAGES } from "../../constants/messages";

describe("ProjectDeleteConfirmation", () => {
  // Mock project data
  const mockProject: Project = {
    id: 1,
    name: "Test Project",
    description: "Test description",
    status: "planned",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  // Mock callbacks
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = "unset";
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = "unset";
  });

  describe("Modal Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should not render when project is null", () => {
      render(
        <ProjectDeleteConfirmation
          project={null}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render modal when isOpen is true and project exists", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Delete Project?")).toBeInTheDocument();
    });

    it("should display project name in the modal", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Test Project/)).toBeInTheDocument();
    });

    it("should display warning message about permanence", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/This action cannot be undone/)
      ).toBeInTheDocument();
      expect(screen.getByText(/permanently deleted/)).toBeInTheDocument();
    });

    it("should render Cancel and Delete buttons", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /confirm delete test project/i })
      ).toBeInTheDocument();
    });

    it("should prevent body scroll when modal is open", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should restore body scroll when modal is closed", () => {
      const { rerender } = render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(document.body.style.overflow).toBe("hidden");

      rerender(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(document.body.style.overflow).toBe("unset");
    });
  });

  describe("User Interactions - Cancel", () => {
    it("should call onCancel when Cancel button is clicked", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it("should call onCancel when backdrop is clicked", async () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Get the backdrop element
      const backdrop = screen.getByTestId("modal-backdrop");

      // Click on the backdrop directly (not on content)
      // Using fireEvent with proper event setup
      const event = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(event, "target", {
        value: backdrop,
        writable: false,
      });
      Object.defineProperty(event, "currentTarget", {
        value: backdrop,
        writable: false,
      });

      fireEvent(backdrop, event);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should not call onCancel when modal content is clicked", async () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const modalContent = screen.getByTestId("modal-content");

      // Click the modal content - this should not close
      fireEvent.click(modalContent);

      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it("should call onCancel when ESC key is pressed", async () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      });
    });

    it("should not call onCancel when other keys are pressed", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: "Enter" });
      fireEvent.keyDown(document, { key: "Space" });

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe("User Interactions - Delete", () => {
    it("should call onConfirm with project ID when Delete button is clicked", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(mockProject.id);
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it("should show loading state during deletion", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnConfirm.mockReturnValue(deletePromise);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/deleting/i)).toBeInTheDocument();
      });

      // Buttons should be disabled
      expect(deleteButton).toBeDisabled();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();

      // Resolve the promise
      resolveDelete!();
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it("should disable buttons during deletion", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnConfirm.mockReturnValue(deletePromise);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });

      resolveDelete!();
    });

    it("should display loading spinner during deletion", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnConfirm.mockReturnValue(deletePromise);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const spinner = deleteButton.querySelector("svg.animate-spin");
        expect(spinner).toBeInTheDocument();
      });

      resolveDelete!();
    });

    it("should display loading spinner with correct test ID", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnConfirm.mockReturnValue(deletePromise);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const spinner = screen.getByTestId("deleting-spinner");
        expect(spinner).toBeInTheDocument();
        expect(spinner).toHaveClass("animate-spin");
      });

      resolveDelete!();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when deletion fails", async () => {
      const errorMessage = "Network error occurred";
      mockOnConfirm.mockRejectedValue(new Error(errorMessage));

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should display generic error message for non-Error objects", async () => {
      mockOnConfirm.mockRejectedValue("String error");

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(
          screen.getByText(ERROR_MESSAGES.DELETE_PROJECT)
        ).toBeInTheDocument();
      });
    });

    it("should keep modal open after error", async () => {
      mockOnConfirm.mockRejectedValue(new Error("Delete failed"));

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete failed")).toBeInTheDocument();
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it("should re-enable buttons after error", async () => {
      mockOnConfirm.mockRejectedValue(new Error("Delete failed"));

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete failed")).toBeInTheDocument();
      });

      expect(deleteButton).not.toBeDisabled();
      expect(cancelButton).not.toBeDisabled();
    });

    it("should clear previous error on new delete attempt", async () => {
      mockOnConfirm.mockRejectedValueOnce(new Error("First error"));

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Mock success for second attempt
      mockOnConfirm.mockResolvedValue(undefined);

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
      });
    });

    it("should allow retry after error", async () => {
      mockOnConfirm
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(undefined);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });

      // First attempt - fails
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });

      // Second attempt - succeeds
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(2);
      });
    });

    it("should clear error when cancel is clicked", async () => {
      mockOnConfirm.mockRejectedValue(new Error("Delete failed"));

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete failed")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA role", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-labelledby pointing to title", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
      expect(screen.getByText("Delete Project?")).toHaveAttribute(
        "id",
        "modal-title"
      );
    });

    it("should have aria-describedby pointing to description", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-describedby", "modal-description");

      const description = screen
        .getByText(/Are you sure you want to delete/)
        .closest("div");
      expect(description).toHaveAttribute("id", "modal-description");
    });

    it('should have role="alert" for error messages', async () => {
      mockOnConfirm.mockRejectedValue(new Error("Error occurred"));

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole("alert");
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent("Error occurred");
      });
    });

    it("should hide decorative SVGs from screen readers", () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe("Focus Management", () => {
    it("should focus Cancel button when modal opens", async () => {
      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(
        () => {
          const cancelButton = screen.getByRole("button", { name: /cancel/i });
          expect(cancelButton).toHaveFocus();
        },
        { timeout: 100 }
      );
    });

    it("should trap focus within modal on Tab", async () => {
      const user = userEvent.setup();

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });

      // Focus should start on cancel button
      await waitFor(() => {
        expect(cancelButton).toHaveFocus();
      });

      // Tab to delete button
      await user.tab();
      expect(deleteButton).toHaveFocus();

      // Tab should wrap to cancel button
      await user.tab();
      expect(cancelButton).toHaveFocus();
    });

    it("should trap focus within modal on Shift+Tab", async () => {
      const user = userEvent.setup();

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });

      // Focus should start on cancel button
      await waitFor(() => {
        expect(cancelButton).toHaveFocus();
      });

      // Shift+Tab should wrap to delete button
      await user.tab({ shift: true });
      expect(deleteButton).toHaveFocus();

      // Shift+Tab should go back to cancel button
      await user.tab({ shift: true });
      expect(cancelButton).toHaveFocus();
    });

    it("should not allow ESC to close modal during deletion", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnConfirm.mockReturnValue(deletePromise);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/deleting/i)).toBeInTheDocument();
      });

      // Try to close with ESC during deletion
      fireEvent.keyDown(document, { key: "Escape" });

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      resolveDelete!();
    });

    it("should not allow backdrop click during deletion", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnConfirm.mockReturnValue(deletePromise);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/deleting/i)).toBeInTheDocument();
      });

      // Try to close with backdrop click during deletion
      const backdrop = screen.getByTestId("modal-backdrop");
      const event = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(event, "target", {
        value: backdrop,
        writable: false,
      });
      Object.defineProperty(event, "currentTarget", {
        value: backdrop,
        writable: false,
      });
      fireEvent(backdrop, event);

      expect(mockOnCancel).not.toHaveBeenCalled();

      resolveDelete!();
    });
  });

  describe("Edge Cases", () => {
    it("should not call onConfirm if project is null", async () => {
      const { rerender } = render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Change project to null
      rerender(
        <ProjectDeleteConfirmation
          project={null}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Modal should not render
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should handle rapid clicks on delete button", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });

      // Click multiple times rapidly
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        // Should only be called once due to disabled state
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle different project objects", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      const { rerender } = render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Test Project/)).toBeInTheDocument();

      const newProject: Project = {
        ...mockProject,
        id: 2,
        name: "Another Project",
      };

      rerender(
        <ProjectDeleteConfirmation
          project={newProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Another Project/)).toBeInTheDocument();

      const deleteButton = screen.getByRole("button", {
        name: /confirm delete another project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(2);
      });
    });

    it("should clean up event listeners on unmount", () => {
      const { unmount } = render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(document.body.style.overflow).toBe("hidden");

      unmount();

      expect(document.body.style.overflow).toBe("unset");

      // ESC key should not trigger anything after unmount
      fireEvent.keyDown(document, { key: "Escape" });
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it("should handle Tab key when no focusable elements exist", async () => {
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnConfirm.mockReturnValue(deletePromise);

      render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Click delete to disable all buttons
      const deleteButton = screen.getByRole("button", {
        name: /confirm delete test project/i,
      });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/deleting/i)).toBeInTheDocument();
      });

      // Now all buttons are disabled - test Tab key handling
      const modalContent = screen.getByTestId("modal-content");
      fireEvent.keyDown(modalContent, { key: "Tab" });

      // Should not crash and no cancel should be called
      expect(mockOnCancel).not.toHaveBeenCalled();

      resolveDelete!();
    });

    it("should not attempt deletion if project becomes null", async () => {
      const { rerender } = render(
        <ProjectDeleteConfirmation
          project={mockProject}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Get the delete button while project exists
      screen.getByRole("button", {
        name: /confirm delete test project/i,
      });

      // Set project to null before clicking
      rerender(
        <ProjectDeleteConfirmation
          project={null}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Modal should not render when project is null
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it("should handle null project in aria-label gracefully", () => {
      render(
        <ProjectDeleteConfirmation
          project={null}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Should not render dialog when project is null
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
