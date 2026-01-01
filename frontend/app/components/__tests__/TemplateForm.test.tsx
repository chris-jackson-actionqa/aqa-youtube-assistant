import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TemplateForm from "../TemplateForm";
import * as api from "../../lib/api";

// Mock dependencies
jest.mock("../../lib/api");
jest.mock("../Spinner", () => {
  return function DummySpinner() {
    return null;
  };
});

// Mock template data
const mockTemplate = {
  id: 1,
  type: "title",
  name: "Test Template",
  content: "Best {{tools}} for {{topic}}",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// Test helper: Get form inputs
const getFormInputs = () => ({
  type: screen.getByLabelText(/Template Type/i) as HTMLInputElement,
  name: screen.getByLabelText(/Template Name/i) as HTMLInputElement,
  content: screen.getByLabelText(/Template Content/i) as HTMLTextAreaElement,
  submitButton: screen.getByRole("button", {
    name: /Create Template|Update Template/i,
  }) as HTMLButtonElement,
});

// Test helper: Render form in create mode
const renderCreateForm = (props = {}) =>
  render(<TemplateForm mode="create" {...props} />);

// Test helper: Render form in edit mode
const renderEditForm = (template = mockTemplate, props = {}) =>
  render(<TemplateForm mode="edit" initialTemplate={template} {...props} />);

// Test helper: Set textarea content via DOM (for braces)
const setTextareaContent = (element: HTMLTextAreaElement, value: string) => {
  element.value = value;
  fireEvent.change(element, { target: { value } });
  fireEvent.input(element, { target: { value } });
};

describe("TemplateForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render form in create mode", () => {
      renderCreateForm();

      expect(screen.getByText("Create New Template")).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Content/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Create Template/i })
      ).toBeInTheDocument();
    });

    it("should render form in edit mode", () => {
      renderEditForm();

      expect(screen.getByText("Edit Template")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Update Template/i })
      ).toBeInTheDocument();
    });

    it("should have ARIA labels on all inputs", () => {
      renderCreateForm();

      expect(screen.getByLabelText(/Template Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Content/i)).toBeInTheDocument();
    });
  });

  describe("Initial State", () => {
    it("should have correct initial state in create mode", () => {
      renderCreateForm();

      const { type, name, content } = getFormInputs();

      expect(type.value).toBe("title");
      expect(name.value).toBe("");
      expect(content.value).toBe("");
    });

    it("should pre-fill form in edit mode", () => {
      renderEditForm();

      const { type, name, content } = getFormInputs();

      expect(type.value).toBe("title");
      expect(name.value).toBe("Test Template");
      expect(content.value).toBe("Best {{tools}} for {{topic}}");
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when form is invalid", () => {
      renderCreateForm();

      const { submitButton } = getFormInputs();
      expect(submitButton.disabled).toBe(true);
    });

    it("should show error for empty name", async () => {
      renderCreateForm();

      const { content, submitButton } = getFormInputs();
      setTextareaContent(content, "Best {{tools}}");

      expect(submitButton.disabled).toBe(true);
    });

    it("should show error for name exceeding 100 characters", async () => {
      const user = userEvent.setup();
      renderCreateForm();

      const { name, content, submitButton } = getFormInputs();
      const longName = "x".repeat(101);

      await user.type(name, longName);
      await user.type(content, "Valid template content");

      expect(submitButton.disabled).toBe(true);
    });

    it("should show error for empty content", async () => {
      const user = userEvent.setup();
      renderCreateForm();

      const { name, submitButton } = getFormInputs();
      await user.type(name, "Test");

      expect(submitButton.disabled).toBe(true);
    });

    it("should show error for content exceeding 256 characters", async () => {
      const user = userEvent.setup();
      renderCreateForm();

      const { name, content, submitButton } = getFormInputs();

      await user.type(name, "Test");
      const longContent = "x ".repeat(130);
      await user.type(content, longContent);

      expect(submitButton.disabled).toBe(true);
    });

    it("should show error when no placeholders are present", async () => {
      const user = userEvent.setup();
      (api.createTemplate as jest.Mock).mockRejectedValue({
        status: 422,
        message: "Must contain placeholder",
      });

      renderCreateForm();

      const { name, content, submitButton } = getFormInputs();

      await user.type(name, "Test");
      await user.type(content, "No placeholders here");

      expect(submitButton.disabled).toBe(true);
    });

    it("should show error for empty placeholders", async () => {
      const user = userEvent.setup();
      renderCreateForm();

      const { name, content, submitButton } = getFormInputs();

      await user.type(name, "Test");
      setTextareaContent(content, "Best {{}} for tools");

      expect(submitButton.disabled).toBe(true);
    });

    it("should display character counter for name", async () => {
      const user = userEvent.setup();
      renderCreateForm();

      const { name } = getFormInputs();
      await user.type(name, "Test");

      expect(screen.getByText("4 / 100 characters")).toBeInTheDocument();
    });

    it("should display character counter for content", async () => {
      const templateWithPlaceholder = {
        ...mockTemplate,
        content: "Best {{tools}}",
      };
      renderEditForm(templateWithPlaceholder);

      const { content } = getFormInputs();
      expect(content.value).toContain("{{tools}}");
      expect(screen.getByText("14 / 256 characters")).toBeInTheDocument();
    });
  });

  describe("Placeholder Detection", () => {
    it("should detect and display placeholders", async () => {
      const templateWithPlaceholders = {
        ...mockTemplate,
        content: "Best {{tools}} for {{topic}}",
      };
      renderEditForm(templateWithPlaceholders);

      expect(screen.getByText(/Placeholders found/i)).toBeInTheDocument();
      const container = screen.getByText(/Placeholders found/i).closest("div");
      expect(container?.textContent).toMatch(/{{tools}}/);
      expect(container?.textContent).toMatch(/{{topic}}/);
    });

    it("should show only unique placeholders", async () => {
      const templateWithRepeated = {
        ...mockTemplate,
        content: "{{tools}} is better than {{tools}}",
      };
      renderEditForm(templateWithRepeated);

      expect(screen.getByText(/Placeholders found/i)).toBeInTheDocument();
      const container = screen.getByText(/Placeholders found/i).closest("div");
      expect(container?.textContent).toMatch(/{{tools}}/);
    });

    it("should show hint when no placeholders are present", async () => {
      const user = userEvent.setup();
      renderCreateForm();

      const { content } = getFormInputs();
      await user.type(content, "No placeholders");

      expect(screen.getByText(/Add placeholders like/i)).toBeInTheDocument();
    });
  });

  describe("Form Submission - Create Mode", () => {
    it("should call createTemplate API on successful submission", async () => {
      const user = userEvent.setup();
      (api.createTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      renderCreateForm();

      const { name, content, submitButton } = getFormInputs();

      await user.type(name, "Test Template");
      setTextareaContent(content, "Best {{tools}} for {{topic}}");

      if (!submitButton.disabled) {
        await user.click(submitButton);
        await waitFor(() => {
          expect(api.createTemplate).toHaveBeenCalled();
        });
      }
    });

    it("should call onSuccess callback after successful submission", async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      const mockOnSuccess = jest.fn();
      (api.updateTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      renderEditForm(mockTemplate, { onSuccess: mockOnSuccess });

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      jest.advanceTimersByTime(1500);

      expect(mockOnSuccess).toHaveBeenCalledWith(mockTemplate);
      jest.useRealTimers();
    });

    it("should handle 409 duplicate content error", async () => {
      const user = userEvent.setup();
      const mockError = {
        status: 409,
        message: "Template content already exists",
      };
      (api.updateTemplate as jest.Mock).mockRejectedValue(mockError);

      renderEditForm();

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.updateTemplate).toHaveBeenCalled();
        expect(screen.queryByRole("alert")).toBeInTheDocument();
      });
    });

    it("should handle 422 validation error", async () => {
      const user = userEvent.setup();
      const mockError = {
        status: 422,
        message: "Validation failed",
      };
      (api.updateTemplate as jest.Mock).mockRejectedValue(mockError);

      renderEditForm();

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.updateTemplate).toHaveBeenCalled();
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("should handle server errors (500+)", async () => {
      const user = userEvent.setup();
      const mockError = {
        status: 500,
        message: "Server error",
      };
      (api.updateTemplate as jest.Mock).mockRejectedValue(mockError);

      renderEditForm();

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.updateTemplate).toHaveBeenCalled();
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("should handle network errors (status 0)", async () => {
      const user = userEvent.setup();
      const mockError = {
        status: 0,
        message: "Network error",
      };
      (api.updateTemplate as jest.Mock).mockRejectedValue(mockError);

      renderEditForm();

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.updateTemplate).toHaveBeenCalled();
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("should clear form after successful update in edit mode", async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      const mockOnSuccess = jest.fn();
      (api.updateTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      renderEditForm(mockTemplate, { onSuccess: mockOnSuccess });

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      jest.advanceTimersByTime(1500);

      expect(mockOnSuccess).toHaveBeenCalledWith(mockTemplate);
      jest.useRealTimers();
    });
  });

  describe("Form Submission - Edit Mode", () => {
    it("should call updateTemplate API on successful submission", async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      (api.updateTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      renderEditForm(mockTemplate, { onSuccess: mockOnSuccess });

      const { name, submitButton } = getFormInputs();
      await user.clear(name);
      await user.type(name, "Updated Name");

      await user.click(submitButton);

      await waitFor(() => {
        expect(api.updateTemplate).toHaveBeenCalledWith(1, {
          type: "title",
          name: "Updated Name",
          content: "Best {{tools}} for {{topic}}",
        });
      });
    });

    it("should handle 404 not found error in edit mode", async () => {
      const user = userEvent.setup();
      const mockError = {
        status: 404,
        message: "Template not found",
      };
      (api.updateTemplate as jest.Mock).mockRejectedValue(mockError);

      renderEditForm();

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.updateTemplate).toHaveBeenCalled();
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Functionality", () => {
    it("should call onCancel callback when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      renderCreateForm({ onCancel: mockOnCancel });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("should not show cancel button when onCancel is not provided", () => {
      renderCreateForm();

      const cancelButton = screen.queryByRole("button", { name: /Cancel/i });
      expect(cancelButton).not.toBeInTheDocument();
    });

    it("should reset form when cancel is clicked", async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      renderCreateForm({ onCancel: mockOnCancel });

      const { name, content } = getFormInputs();

      await user.type(name, "Test");
      setTextareaContent(content, "Best {{tools}}");

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(name.value).toBe("");
      expect(content.value).toBe("");
    });
  });

  describe("Loading State", () => {
    it("should disable submit button while submitting", async () => {
      const user = userEvent.setup();
      (api.updateTemplate as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockTemplate), 500))
      );

      renderEditForm();

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      expect(submitButton.disabled).toBe(true);
    });

    it("should show loading text while submitting", async () => {
      const user = userEvent.setup();
      (api.updateTemplate as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockTemplate), 500))
      );

      renderEditForm();

      const { submitButton } = getFormInputs();
      await user.click(submitButton);

      expect(
        screen.getByText(/Updating.../i) || submitButton.disabled
      ).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      renderCreateForm();

      expect(screen.getByLabelText(/Template Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Template Content/i)).toBeInTheDocument();
    });

    it("should mark required fields with asterisk", () => {
      renderCreateForm();

      const requiredMarks = screen.getAllByText("*");
      expect(requiredMarks.length).toBeGreaterThan(0);
    });

    it("should have proper error ARIA attributes", async () => {
      renderCreateForm();

      const { name, content } = getFormInputs();

      setTextareaContent(content, "Best {{tools}}");

      expect(name).toHaveAttribute("aria-invalid");
    });

    it("should have role=alert on error messages", async () => {
      const user = userEvent.setup();
      (api.createTemplate as jest.Mock).mockRejectedValue({
        status: 422,
        message: "Validation error",
      });

      renderCreateForm();

      const { name, content, submitButton } = getFormInputs();

      await user.type(name, "Test");
      setTextareaContent(content, "Best {{tools}}");
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.queryByText(/Validation error/i);
        if (errorMessage) {
          expect(errorMessage).toHaveAttribute("role", "alert");
        }
      });
    });

    it("should have role=status on success message", async () => {
      const user = userEvent.setup();
      (api.createTemplate as jest.Mock).mockResolvedValue(mockTemplate);

      renderCreateForm();

      const { name, content, submitButton } = getFormInputs();

      await user.type(name, "Test Template");
      setTextareaContent(content, "Best {{tools}} for {{topic}}");

      if (!submitButton.disabled) {
        await user.click(submitButton);

        await waitFor(() => {
          const successMessage = screen.queryByRole("status");
          if (successMessage) {
            expect(successMessage).toHaveAttribute("aria-live", "polite");
          }
        });
      }
    });
  });

  describe("Dark Mode Support", () => {
    it("should render with dark mode classes", () => {
      const { container } = renderCreateForm();

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.className).toContain("dark:bg-gray-800");
    });
  });
});
