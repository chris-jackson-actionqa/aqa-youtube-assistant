import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateDropdown } from "../TemplateDropdown";
import { getTemplates } from "@/app/lib/api";

jest.mock("@/app/lib/api");

type Template =
  Awaited<ReturnType<typeof getTemplates>> extends Array<infer T> ? T : never;

const mockTemplates: Template[] = [
  {
    id: 1,
    type: "title",
    name: "Launch Title",
    content: "Launch your product with confidence",
    workspace_id: 1,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    type: "title",
    name: "Engagement Boost",
    content: "Unlock engagement with this format",
    workspace_id: 1,
    created_at: "2025-01-02T00:00:00Z",
    updated_at: "2025-01-02T00:00:00Z",
  },
];

describe("TemplateDropdown", () => {
  const user = userEvent.setup();

  const mockOnTemplateSelect = jest.fn();
  const mockOnClose = jest.fn();

  const renderComponent = (
    templates: Template[] = mockTemplates,
    loading: boolean = false,
    error: string | null = null,
    isApplying: boolean = false
  ) => {
    render(
      <TemplateDropdown
        templates={templates}
        loading={loading}
        error={error}
        isApplying={isApplying}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders dropdown with header and description", () => {
    renderComponent();

    expect(screen.getByText("Apply Template")).toBeInTheDocument();
    expect(
      screen.getByText("Pick a saved title to apply.")
    ).toBeInTheDocument();
  });

  it("renders all templates", () => {
    renderComponent();

    expect(screen.getByText("Launch Title")).toBeInTheDocument();
    expect(screen.getByText("Engagement Boost")).toBeInTheDocument();
  });

  it("displays template content", () => {
    renderComponent();

    expect(
      screen.getByText("Launch your product with confidence")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Unlock engagement with this format")
    ).toBeInTheDocument();
  });

  it("calls onTemplateSelect when template is clicked", async () => {
    renderComponent();

    await user.click(screen.getByText("Launch Title"));

    expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[0]);
  });

  it("disables template buttons when isApplying is true", () => {
    renderComponent(mockTemplates, false, null, true);

    const templateButtons = screen.getAllByRole("button", { hidden: false });
    const templateSelectionButtons = templateButtons.filter(
      (btn) =>
        btn.textContent?.includes("Launch Title") ||
        btn.textContent?.includes("Engagement Boost")
    );

    templateSelectionButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("shows loading state", () => {
    renderComponent([], true);

    expect(screen.getByText("Loading templates...")).toBeInTheDocument();
  });

  it("shows empty state when no templates", () => {
    renderComponent([]);

    expect(screen.getByText("No templates available")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create your first template/i })
    ).toHaveAttribute("href", "/templates");
  });

  it("displays error message", () => {
    const errorMessage = "Failed to load templates";
    renderComponent([], false, errorMessage);

    expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
  });

  it("calls onClose when close button is clicked", async () => {
    renderComponent();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", async () => {
    renderComponent();

    const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
    await user.click(cancelButtons[cancelButtons.length - 1]); // Last cancel button

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("has correct ARIA attributes", () => {
    renderComponent();

    const dropdown = screen.getByRole("menu");
    expect(dropdown).toHaveAttribute("aria-label", "Template list");
  });

  it("renders all template content with correct styling", () => {
    renderComponent();

    mockTemplates.forEach((template) => {
      const templateContent = screen.getByText(template.content);
      expect(templateContent).toHaveClass("break-words");
    });
  });

  it("shows select indicator for each template", () => {
    renderComponent();

    const selectIndicators = screen.getAllByText("Select");
    expect(selectIndicators).toHaveLength(mockTemplates.length);
  });

  it("renders dropdown menu with correct z-index class", () => {
    renderComponent();

    const dropdown = screen.getByRole("menu");
    expect(dropdown).toHaveClass("z-20");
  });
});
