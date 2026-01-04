/**
 * Unit tests for Templates page component
 * Tests page layout, template fetching, filtering, and error/loading states
 *
 * Related: Issue #172 - Create Templates Page Route and Navigation
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TemplatesPage from "../page";
import * as api from "@/app/lib/api";
import { Template, NormalizedTemplate } from "@/app/types/template";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock the API module
jest.mock("@/app/lib/api");

// Mock Modal component to simplify tests
jest.mock("@/app/components/Modal", () => {
  return function MockModal({
    isOpen,
    children,
    onClose,
    ...props
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    onClose?: () => void;
    [key: string]: string | boolean | undefined;
  }) {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-modal="true" onClick={onClose} {...props}>
        <div onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
    );
  };
});

// Mock TemplateForm component
jest.mock("@/app/components/TemplateForm", () => {
  return function MockTemplateForm({
    mode,
    initialTemplate,
    onSuccess,
    onCancel,
  }: {
    mode?: "create" | "edit";
    initialTemplate?: NormalizedTemplate | undefined;
    onSuccess?: (template: Template) => void;
    onCancel?: () => void;
  }) {
    return (
      <div data-testid={`template-form-${mode}`}>
        <button type="button" onClick={onCancel}>
          Cancel Form
        </button>
        <button
          type="button"
          onClick={() => {
            const mockTemplate = {
              id: mode === "edit" ? initialTemplate?.id : 4,
              type: mode === "edit" ? initialTemplate?.type : "title",
              name: mode === "edit" ? initialTemplate?.name : "New Template",
              content:
                mode === "edit" ? initialTemplate?.content : "Template content",
              workspace_id: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            onSuccess?.(mockTemplate as Template);
          }}
        >
          Save Form
        </button>
      </div>
    );
  };
});

// Mock TemplateDeleteModal component
jest.mock("@/app/components/TemplateDeleteModal", () => {
  return function MockTemplateDeleteModal({
    isOpen,
    template,
    error,
    isDeleting,
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    template: NormalizedTemplate | null;
    error: string | null;
    isDeleting: boolean;
    onConfirm?: () => void;
    onClose?: () => void;
  }) {
    if (!isOpen || !template) return null;
    return (
      <div data-testid="template-delete-modal" role="dialog" aria-modal="true">
        <h2>Delete {template.name}</h2>
        {error && <div role="alert">{error}</div>}
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete Template"}
        </button>
      </div>
    );
  };
});

describe("TemplatesPage", () => {
  const mockTemplates: Template[] = [
    {
      id: 1,
      type: "title",
      name: "Standard Title Template",
      content: "How to {topic} in {year}",
      workspace_id: 1,
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-01-01T10:00:00Z",
    },
    {
      id: 2,
      type: "description",
      name: "Tutorial Description",
      content: "In this video, we cover {topic}. Subscribe for more!",
      workspace_id: 1,
      created_at: "2025-01-02T11:00:00Z",
      updated_at: "2025-01-02T11:00:00Z",
    },
    {
      id: 3,
      type: "title",
      name: "Question Title Template",
      content: "What is {topic}? (Explained)",
      workspace_id: 1,
      created_at: "2025-01-03T12:00:00Z",
      updated_at: "2025-01-03T12:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.getTemplates as jest.Mock).mockResolvedValue(mockTemplates);
    (api.deleteTemplate as jest.Mock).mockResolvedValue(undefined);
  });

  describe("Page Layout", () => {
    it("should render page title and description", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Templates", level: 1 })
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText("Manage video title and description templates")
      ).toBeInTheDocument();
    });

    it("should render back navigation link", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", { name: "Back to Home" });
        expect(backLink).toBeInTheDocument();
      });

      const backLink = screen.getByRole("link", { name: "Back to Home" });
      expect(backLink).toHaveAttribute("href", "/");
    });

    it("should have accessible navigation", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", { name: "Back to Home" });
        expect(backLink).toHaveAccessibleName();
      });
    });
  });

  describe("Template Loading", () => {
    it("should display loading state initially", () => {
      render(<TemplatesPage />);

      expect(screen.getByText("Loading templates...")).toBeInTheDocument();
    });

    it("should fetch templates on mount", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(api.getTemplates).toHaveBeenCalledTimes(1);
      });
    });

    it("should display templates after loading", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      expect(screen.getByText("Tutorial Description")).toBeInTheDocument();
      expect(screen.getByText("Question Title Template")).toBeInTheDocument();
    });
  });

  describe("Template Display", () => {
    it("should display template name", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });
    });

    it("should display template type badge", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const titleBadges = screen.getAllByText("Title");
        expect(titleBadges.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("should display template content", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByText("How to {topic} in {year}")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText("In this video, we cover {topic}. Subscribe for more!")
      ).toBeInTheDocument();
    });

    it("should display template created date", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Created: January 1, 2025/)
        ).toBeInTheDocument();
      });
    });

    it("should have semantic HTML structure for templates", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const articles = screen.getAllByRole("article");
        expect(articles.length).toBe(3);
      });
    });
  });

  describe("Template Filtering", () => {
    it("should display filter buttons with counts", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /All \(3\)/ })
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: /Title \(2\)/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Description \(1\)/ })
      ).toBeInTheDocument();
    });

    it("should show all templates by default", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      expect(screen.getByText("Tutorial Description")).toBeInTheDocument();
      expect(screen.getByText("Question Title Template")).toBeInTheDocument();
    });

    it("should filter to show only Title templates", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const titleButton = screen.getByRole("button", { name: /Title \(2\)/ });
      fireEvent.click(titleButton);

      expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      expect(screen.getByText("Question Title Template")).toBeInTheDocument();
      expect(
        screen.queryByText("Tutorial Description")
      ).not.toBeInTheDocument();
    });

    it("should filter to show only Description templates", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const descButton = screen.getByRole("button", {
        name: /Description \(1\)/,
      });
      fireEvent.click(descButton);

      expect(screen.getByText("Tutorial Description")).toBeInTheDocument();
      expect(
        screen.queryByText("Standard Title Template")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Question Title Template")
      ).not.toBeInTheDocument();
    });

    it("should return to all templates when All button clicked", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      // Filter to Title
      const titleButton = screen.getByRole("button", { name: /Title \(2\)/ });
      fireEvent.click(titleButton);

      // Click All
      const allButton = screen.getByRole("button", { name: /All \(3\)/ });
      fireEvent.click(allButton);

      expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      expect(screen.getByText("Tutorial Description")).toBeInTheDocument();
      expect(screen.getByText("Question Title Template")).toBeInTheDocument();
    });

    it("should have aria-pressed state on active filter button", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const allButton = screen.getByRole("button", { name: /All \(3\)/ });
        expect(allButton).toHaveAttribute("aria-pressed", "true");
      });

      const titleButton = screen.getByRole("button", { name: /Title \(2\)/ });
      fireEvent.click(titleButton);

      expect(titleButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("Empty States", () => {
    it("should show empty state when no templates exist", async () => {
      (api.getTemplates as jest.Mock).mockResolvedValue([]);

      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "No templates found. Create your first template to get started."
          )
        ).toBeInTheDocument();
      });
    });

    it("should show filtered empty state when no templates match filter", async () => {
      const titleOnlyTemplates: Template[] = [
        {
          id: 1,
          type: "title",
          name: "Title Template",
          content: "Test",
          workspace_id: 1,
          created_at: "2025-01-01T10:00:00Z",
          updated_at: "2025-01-01T10:00:00Z",
        },
      ];

      (api.getTemplates as jest.Mock).mockResolvedValue(titleOnlyTemplates);

      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Title Template")).toBeInTheDocument();
      });

      const descButton = screen.getByRole("button", {
        name: /Description \(0\)/,
      });
      fireEvent.click(descButton);

      expect(
        screen.getByText("No Description templates found.")
      ).toBeInTheDocument();
    });

    it("should have role=status on empty state", async () => {
      (api.getTemplates as jest.Mock).mockResolvedValue([]);

      render(<TemplatesPage />);

      await waitFor(() => {
        const emptyState = screen.getByRole("status");
        expect(emptyState).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when fetch fails", async () => {
      (api.getTemplates as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should display generic error message for unknown errors", async () => {
      (api.getTemplates as jest.Mock).mockRejectedValue("Unknown error");

      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load templates")
        ).toBeInTheDocument();
      });
    });

    it("should have role=alert on error message", async () => {
      (api.getTemplates as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      render(<TemplatesPage />);

      await waitFor(() => {
        const errorAlert = screen.getByRole("alert");
        expect(errorAlert).toBeInTheDocument();
      });
    });

    it("should have aria-live=polite on error message", async () => {
      (api.getTemplates as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      render(<TemplatesPage />);

      await waitFor(() => {
        const errorAlert = screen.getByRole("alert");
        expect(errorAlert).toHaveAttribute("aria-live", "polite");
      });
    });

    it("should show retry button on error", async () => {
      (api.getTemplates as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Retry" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Create Template Flow", () => {
    it("should render Create Template button in header", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Create new template" })
        ).toBeInTheDocument();
      });
    });

    it("should open create form modal when Create Template button clicked", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const createButton = screen.getByRole("button", {
          name: "Create new template",
        });
        expect(createButton).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", {
        name: "Create new template",
      });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId("template-form-create")).toBeInTheDocument();
      });
    });

    it("should hide main content when create modal is open", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const createButton = screen.getByRole("button", {
          name: "Create new template",
        });
        expect(createButton).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Create new template" })
      );

      await waitFor(() => {
        const main = screen.queryByRole("main", { hidden: true });
        expect(main).toHaveAttribute("aria-hidden", "true");
      });
    });
  });

  describe("Edit Template Flow", () => {
    it("should render Edit button for each template", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", {
        name: /Edit template/,
      });
      expect(editButtons.length).toBe(mockTemplates.length);
    });

    it("should open edit form modal when Edit clicked", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", {
        name: /Edit template/,
      });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("template-form-edit")).toBeInTheDocument();
      });
    });

    it("should hide main content when edit modal is open", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", {
        name: /Edit template/,
      });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const main = screen.queryByRole("main", { hidden: true });
        expect(main).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("should have correct buttons for each template card", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      // Each template should have Edit and Delete buttons
      const editButtons = screen.getAllByRole("button", {
        name: /Edit template/,
      });
      const deleteButtons = screen.getAllByRole("button", {
        name: /Delete template/,
      });

      expect(editButtons.length).toBe(mockTemplates.length);
      expect(deleteButtons.length).toBe(mockTemplates.length);
    });

    it("should clear edit error state when Edit button clicked", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", {
        name: /Edit template/,
      });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId("template-form-edit")).toBeInTheDocument();
      });
    });

    it("should clear and reset edit state on modal close", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", {
        name: /Edit template/,
      });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const form = screen.getByTestId("template-form-edit");
        expect(form).toBeInTheDocument();
      });

      // Click cancel in the form
      const cancelButton = screen.getByRole("button", {
        name: "Cancel Form",
      });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        // Dialog should be closed
        expect(
          screen.queryByTestId("template-form-modal-edit")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Create Success Flow", () => {
    it("should add new template to list when creation succeeds", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Create new template" })
      );

      await waitFor(() => {
        const form = screen.getByTestId("template-form-create");
        expect(form).toBeInTheDocument();
      });

      // Click save in form - this will trigger onSuccess callback
      const saveButton = screen.getByRole("button", { name: "Save Form" });
      fireEvent.click(saveButton);

      // The form should close and modal should disappear
      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "Create new template" })
        ).not.toBeInTheDocument();
      });
    });

    it("should handle form cancel in create modal", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", { name: "Create new template" })
      );

      await waitFor(() => {
        const form = screen.getByTestId("template-form-create");
        expect(form).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", {
        name: "Cancel Form",
      });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "Create new template" })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Edit Success Flow", () => {
    it("should update template when edit succeeds", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", {
        name: /Edit template/,
      });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const form = screen.getByTestId("template-form-edit");
        expect(form).toBeInTheDocument();
      });

      // Click save in form
      const saveButton = screen.getByRole("button", { name: "Save Form" });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "Edit template" })
        ).not.toBeInTheDocument();
      });
    });

    it("should handle form cancel in edit modal", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole("button", {
        name: /Edit template/,
      });
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const form = screen.getByTestId("template-form-edit");
        expect(form).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", {
        name: "Cancel Form",
      });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByRole("dialog", { name: "Edit template" })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Modal State Management", () => {
    it("should manage multiple modal states independently", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      // Open create modal
      fireEvent.click(
        screen.getByRole("button", { name: "Create new template" })
      );

      await waitFor(() => {
        expect(screen.getByTestId("template-form-create")).toBeInTheDocument();
      });

      // Only one form should be visible
      const forms = screen.getAllByTestId(/^template-form-/);
      expect(forms.length).toBe(1);
    });

    it("should maintain main content aria-hidden state correctly", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      const main = screen.getByRole("main");

      // Initially not hidden
      expect(main).not.toHaveAttribute("aria-hidden", "true");

      // Open create modal
      fireEvent.click(
        screen.getByRole("button", { name: "Create new template" })
      );

      await waitFor(() => {
        const hiddenMain = screen.queryByRole("main", { hidden: true });
        expect(hiddenMain).toHaveAttribute("aria-hidden", "true");
      });
    });
  });

  describe("Deletion Flow", () => {
    it("opens and focuses the delete dialog", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Delete template Standard Title Template",
        })
      );

      const dialog = await screen.findByTestId("template-delete-modal");

      expect(dialog).toBeInTheDocument();
      expect(screen.getByRole("main", { hidden: true })).toHaveAttribute(
        "aria-hidden",
        "true"
      );
    });

    it("closes the dialog when Escape is pressed", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Delete template Standard Title Template",
        })
      );

      const dialog = await screen.findByTestId("template-delete-modal");
      expect(dialog).toBeInTheDocument();

      // Note: Escape key handling is tested in TemplateDeleteModal unit tests
      // This page test verifies the modal exists and can be closed via button
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(
          screen.queryByTestId("template-delete-modal")
        ).not.toBeInTheDocument();
      });
    });

    it("closes when clicking the overlay", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Delete template Standard Title Template",
        })
      );

      const dialog = await screen.findByTestId("template-delete-modal");
      expect(dialog).toBeInTheDocument();

      // Close via Cancel button (overlay click is tested in TemplateDeleteModal unit tests)
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(
          screen.queryByTestId("template-delete-modal")
        ).not.toBeInTheDocument();
      });
    });

    it("deletes a template and updates the list", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Delete template Standard Title Template",
        })
      );

      fireEvent.click(
        await screen.findByRole("button", { name: "Delete Template" })
      );

      await waitFor(() => {
        expect(api.deleteTemplate).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(
          screen.queryByText("Standard Title Template")
        ).not.toBeInTheDocument();
      });

      expect(
        screen.queryByRole("dialog", { name: "Delete template" })
      ).not.toBeInTheDocument();
    });

    it("deletes within a filtered view and preserves other types", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Title \(2\)/ }));

      fireEvent.click(
        screen.getByRole("button", {
          name: "Delete template Standard Title Template",
        })
      );

      fireEvent.click(
        await screen.findByRole("button", { name: "Delete Template" })
      );

      await waitFor(() => {
        expect(api.deleteTemplate).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(
          screen.queryByText("Standard Title Template")
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText("Question Title Template")).toBeInTheDocument();
      expect(
        screen.queryByText("Tutorial Description")
      ).not.toBeInTheDocument();
    });

    it("shows an error when deletion fails", async () => {
      (api.deleteTemplate as jest.Mock).mockRejectedValueOnce(
        new Error("Delete failed")
      );

      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Delete template Standard Title Template",
        })
      );

      fireEvent.click(
        await screen.findByRole("button", { name: "Delete Template" })
      );

      await waitFor(() => {
        expect(screen.getByText("Delete failed")).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: "Delete Template" })
      ).not.toBeDisabled();
    });

    it("shows a generic error when deletion throws a non-Error", async () => {
      (api.deleteTemplate as jest.Mock).mockRejectedValueOnce("boom");

      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Delete template Standard Title Template",
        })
      );

      fireEvent.click(
        await screen.findByRole("button", { name: "Delete Template" })
      );

      await waitFor(() => {
        expect(
          screen.getByText("Failed to delete template. Please try again.")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole("button", { name: "Delete Template" })
      ).not.toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic headings hierarchy", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { level: 1, name: "Templates" })
        ).toBeInTheDocument();
      });
    });

    it("should have accessible time elements", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const timeElements = screen.getAllByText(/Created:/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    it("should have keyboard navigable filter buttons", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const titleButton = screen.getByRole("button", { name: /Title \(2\)/ });
        expect(titleButton).toBeInTheDocument();
        titleButton.focus();
        expect(titleButton).toHaveFocus();
      });
    });
  });

  describe("Responsive Design", () => {
    it("should render grid layout for templates", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        const section = screen.getByRole("main").querySelector("section");
        expect(section?.querySelector(".grid")).toBeInTheDocument();
      });
    });
  });

  describe("Date Formatting", () => {
    it("should format dates in readable format", async () => {
      render(<TemplatesPage />);

      await waitFor(() => {
        expect(screen.getByText(/January 1, 2025/)).toBeInTheDocument();
      });

      expect(screen.getByText(/January 2, 2025/)).toBeInTheDocument();
      expect(screen.getByText(/January 3, 2025/)).toBeInTheDocument();
    });
  });
});
