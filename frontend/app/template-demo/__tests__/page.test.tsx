import { render, screen } from "@testing-library/react";
import TemplateDemoPage from "../page";
import { Template } from "../../types/template";

// Mock the TemplateForm component to avoid API calls in tests
jest.mock("../../components/TemplateForm", () => {
  return function DummyTemplateForm({
    mode,
    onSuccess,
    onCancel,
  }: {
    mode: string;
    onSuccess?: (template: Template) => void;
    onCancel?: () => void;
  }) {
    return (
      <div data-testid={`template-form-mock-${mode}`}>
        <div>TemplateForm Component ({mode})</div>
        <button
          onClick={() =>
            onSuccess?.({ id: "1", name: "Test", type: "title", content: "" })
          }
        >
          Trigger Success
        </button>
        <button onClick={() => onCancel?.()}>Trigger Cancel</button>
      </div>
    );
  };
});

describe("TemplateDemoPage", () => {
  it("should render the page title", () => {
    render(<TemplateDemoPage />);

    expect(
      screen.getByText(/TemplateForm Component Demo/i)
    ).toBeInTheDocument();
  });

  it("should render create mode section", () => {
    render(<TemplateDemoPage />);

    expect(screen.getByText(/Create Mode/i)).toBeInTheDocument();
  });

  it("should render TemplateForm component in create mode", () => {
    render(<TemplateDemoPage />);

    expect(screen.getByTestId("template-form-mock-create")).toBeInTheDocument();
  });

  it("should have proper heading hierarchy", () => {
    const { container } = render(<TemplateDemoPage />);

    const h1 = container.querySelector("h1");
    const h2 = container.querySelector("h2");

    expect(h1).toBeInTheDocument();
    expect(h2).toBeInTheDocument();
    expect(h1?.textContent).toContain("TemplateForm Component Demo");
    expect(h2?.textContent).toContain("Create Mode");
  });

  it("should have responsive styling classes", () => {
    const { container } = render(<TemplateDemoPage />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv?.className).toContain("min-h-screen");
    expect(mainDiv?.className).toContain("bg-gray-50");
    expect(mainDiv?.className).toContain("dark:bg-gray-900");
  });

  it("should have proper max-width container", () => {
    const { container } = render(<TemplateDemoPage />);

    const contentDiv = container.querySelector(".max-w-4xl");
    expect(contentDiv).toBeInTheDocument();
  });

  it("should render with proper padding", () => {
    const { container } = render(<TemplateDemoPage />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv?.className).toContain("p-8");
  });

  it("should call onSuccess callback when form succeeds", () => {
    render(<TemplateDemoPage />);

    const successButton = screen.getByText("Trigger Success");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const alertSpy = jest.spyOn(window, "alert").mockImplementation();

    successButton.click();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Created template:",
      expect.objectContaining({
        id: "1",
        name: "Test",
      })
    );
    expect(alertSpy).toHaveBeenCalledWith(
      'Template "Test" created successfully!'
    );

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("should call onCancel callback when form is cancelled", () => {
    render(<TemplateDemoPage />);

    const cancelButton = screen.getByText("Trigger Cancel");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    cancelButton.click();

    expect(consoleSpy).toHaveBeenCalledWith("Create cancelled");

    consoleSpy.mockRestore();
  });
});
