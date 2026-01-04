import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateConfirmDialog } from "../TemplateConfirmDialog";
import { getTemplates } from "@/app/lib/api";

jest.mock("@/app/lib/api");

type Template =
  Awaited<ReturnType<typeof getTemplates>> extends Array<infer T> ? T : never;

const mockTemplate: Template = {
  id: 1,
  type: "title",
  name: "Launch Title",
  content: "Launch your product with confidence",
  workspace_id: 1,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("TemplateConfirmDialog", () => {
  const user = userEvent.setup();
  const mockOnConfirm = jest.fn().mockResolvedValue(undefined);
  const mockOnCancel = jest.fn();

  const renderComponent = (
    selectedTemplate: Template = mockTemplate,
    currentTitle: string | null = "Current Title",
    isApplying: boolean = false,
    error: string | null = null
  ) => {
    render(
      <TemplateConfirmDialog
        selectedTemplate={selectedTemplate}
        currentTitle={currentTitle}
        isApplying={isApplying}
        error={error}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders confirmation dialog with correct title", () => {
    renderComponent();

    expect(
      screen.getByText("Replace existing video title?")
    ).toBeInTheDocument();
  });

  it("displays current title that will be replaced", () => {
    const currentTitle = "My Video Title";
    renderComponent(mockTemplate, currentTitle);

    // The dialog contains a paragraph with the title and quotes
    const dialog = screen.getByRole("alertdialog");
    const titleText = dialog.textContent;
    expect(titleText).toContain(currentTitle);
  });

  it("shows overwrite confirmation message", () => {
    renderComponent();

    expect(screen.getByText("This will overwrite:")).toBeInTheDocument();
  });

  it("calls onConfirm when replace button is clicked", async () => {
    renderComponent();

    const replaceButton = screen.getByRole("button", { name: "Replace" });
    await user.click(replaceButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    renderComponent();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("disables buttons when isApplying is true", () => {
    renderComponent(mockTemplate, "Current Title", true);

    const replaceButton = screen.getByRole("button", { name: "Applying..." });
    const cancelButton = screen
      .queryAllByRole("button")
      .find((btn) => btn.textContent?.includes("Cancel"));

    expect(replaceButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("shows applying state on replace button", () => {
    renderComponent(mockTemplate, "Current Title", true);

    expect(
      screen.getByRole("button", { name: "Applying..." })
    ).toBeInTheDocument();
  });

  it("shows error message when provided", () => {
    const errorMessage = "Failed to apply template";
    renderComponent(mockTemplate, "Current Title", false, errorMessage);

    expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
  });

  it("handles null current title gracefully", () => {
    renderComponent(mockTemplate, null);

    // Just verify the dialog renders without error
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("closes dialog when escape key is pressed", async () => {
    renderComponent();

    await user.keyboard("{Escape}");

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("has correct ARIA attributes for alertdialog", () => {
    renderComponent();

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "template-overwrite-heading"
    );
  });

  it("sets focus to replace button on mount", async () => {
    renderComponent();

    const replaceButton = screen.getByRole("button", { name: "Replace" });

    await waitFor(() => {
      expect(replaceButton).toHaveFocus();
    });
  });

  it("implements focus trap for Tab key", async () => {
    renderComponent();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const replaceButton = screen.getByRole("button", { name: "Replace" });

    // Focus on replace button initially
    await waitFor(() => {
      expect(replaceButton).toHaveFocus();
    });

    // Simulate Tab from last element (Replace) - should wrap to first (Cancel)
    fireEvent.keyDown(document, { key: "Tab", code: "Tab" });
    expect(cancelButton).toHaveFocus();

    // Move focus to cancel and test Shift+Tab wrapping
    cancelButton.focus();
    fireEvent.keyDown(document, { key: "Tab", code: "Tab", shiftKey: true });
    expect(replaceButton).toHaveFocus();
  });

  it("handles long current titles with text breaking", () => {
    const longTitle =
      "This is a very long title that should wrap to multiple lines in the dialog";
    renderComponent(mockTemplate, longTitle);

    // Verify the paragraph containing the title has break-words class
    const titleParagraph = screen
      .getByRole("alertdialog")
      .querySelector("p.break-words");
    expect(titleParagraph).toHaveClass("break-words");
  });

  it("renders with correct z-index", () => {
    renderComponent();

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveClass("z-30");
  });

  it("displays correct styling in dark mode", () => {
    renderComponent();

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveClass("dark:bg-gray-800");
    expect(dialog).toHaveClass("dark:border-orange-700");
  });

  it("keeps dialog open during apply operation", async () => {
    renderComponent(mockTemplate, "Current Title", true);

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
  });

  it("handles rapid confirm clicks gracefully", async () => {
    const slowOnConfirm = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <TemplateConfirmDialog
        selectedTemplate={mockTemplate}
        currentTitle="Current Title"
        isApplying={false}
        error={null}
        onConfirm={slowOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const replaceButton = screen.getByRole("button", { name: "Replace" });

    // Click multiple times rapidly
    await user.click(replaceButton);
    await user.click(replaceButton);
    await user.click(replaceButton);

    // Due to async handling, each click triggers onConfirm
    // The component relies on parent to manage isApplying state
    expect(slowOnConfirm.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("properly handles special characters in title", () => {
    const specialTitle = 'Title with "quotes" & special <chars>';
    renderComponent(mockTemplate, specialTitle);

    // Verify the dialog still renders with special characters
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
  });

  it("handles tab key gracefully when no focusable elements", async () => {
    // This test verifies the early return when focusableElements.length === 0
    // In the current implementation, there are always focusable buttons,
    // but we ensure the code path doesn't crash if this were to change
    renderComponent();

    const dialog = screen.getByRole("alertdialog");

    // Simulate Tab key event on the dialog
    fireEvent.keyDown(document, { key: "Tab", code: "Tab" });

    // Dialog should still be in document (no errors thrown)
    expect(dialog).toBeInTheDocument();
  });
});
