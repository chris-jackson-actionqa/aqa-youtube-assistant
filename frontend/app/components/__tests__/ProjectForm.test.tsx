/**
 * Unit tests for ProjectForm component
 * Tests form rendering, validation, submission, and error handling
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectForm from "../ProjectForm";
import * as api from "../../lib/api";

// Mock the API module
jest.mock("../../lib/api");

describe("ProjectForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render the form with all fields", () => {
      render(<ProjectForm />);

      expect(screen.getByText("Create New Project")).toBeInTheDocument();
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create project/i })
      ).toBeInTheDocument();
    });

    it("should show cancel button when onCancel prop is provided", () => {
      const onCancel = jest.fn();
      render(<ProjectForm onCancel={onCancel} />);

      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("should not show cancel button when onCancel prop is not provided", () => {
      render(<ProjectForm />);

      expect(
        screen.queryByRole("button", { name: /cancel/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when title is empty", () => {
      render(<ProjectForm />);

      const submitButton = screen.getByRole("button", {
        name: /create project/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when title is provided", async () => {
      const user = userEvent.setup();
      render(<ProjectForm />);

      const titleInput = screen.getByLabelText(/project name/i);
      await user.type(titleInput, "Test Project");

      const submitButton = screen.getByRole("button", {
        name: /create project/i,
      });
      expect(submitButton).toBeEnabled();
    });

    it("should respect maxLength of 255 characters for title", () => {
      render(<ProjectForm />);

      const titleInput = screen.getByLabelText(
        /project name/i
      ) as HTMLInputElement;
      expect(titleInput.maxLength).toBe(255);
    });

    it("should trim leading and trailing whitespace from project name", async () => {
      const user = userEvent.setup();
      const mockProject = {
        id: 1,
        name: "Test Project",
        description: null,
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (api.createProject as jest.Mock).mockResolvedValue(mockProject);

      render(<ProjectForm />);

      await user.type(
        screen.getByLabelText(/project name/i),
        "  Test Project  "
      );
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith({
          name: "Test Project",
          description: null,
          status: "planned",
        });
      });
    });

    it("should reject whitespace-only project name", async () => {
      const user = userEvent.setup();

      render(<ProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, "   ");

      const submitButton = screen.getByRole("button", {
        name: /create project/i,
      });
      expect(submitButton).toBeDisabled();

      expect(api.createProject).not.toHaveBeenCalled();
    });

    it("should show error message for whitespace-only name when validation is bypassed", async () => {
      const user = userEvent.setup();

      render(<ProjectForm />);

      const nameInput = screen.getByLabelText(
        /project name/i
      ) as HTMLInputElement;

      // Type whitespace
      await user.type(nameInput, "   ");

      // Remove the required attribute and disabled state to bypass HTML5 and button validation
      nameInput.removeAttribute("required");
      const submitButton = screen.getByRole("button", {
        name: /create project/i,
      });
      submitButton.removeAttribute("disabled");

      // Submit the form
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /project name cannot be empty or contain only whitespace/i
          )
        ).toBeInTheDocument();
      });

      expect(api.createProject).not.toHaveBeenCalled();
    });

    it("should respect maxLength of 2000 characters for description", () => {
      render(<ProjectForm />);

      const descriptionInput = screen.getByLabelText(
        /description/i
      ) as HTMLTextAreaElement;
      expect(descriptionInput.maxLength).toBe(2000);
    });

    it("should convert empty description to null", async () => {
      const user = userEvent.setup();
      const mockProject = {
        id: 1,
        name: "Test Project",
        description: null,
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (api.createProject as jest.Mock).mockResolvedValue(mockProject);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      // Leave description empty
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith({
          name: "Test Project",
          description: null,
          status: "planned",
        });
      });
    });

    it("should convert whitespace-only description to null", async () => {
      const user = userEvent.setup();
      const mockProject = {
        id: 1,
        name: "Test Project",
        description: null,
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (api.createProject as jest.Mock).mockResolvedValue(mockProject);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.type(screen.getByLabelText(/description/i), "   ");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith({
          name: "Test Project",
          description: null,
          status: "planned",
        });
      });
    });

    it("should display character counter for description", () => {
      render(<ProjectForm />);

      expect(screen.getByText("0 / 2000 characters")).toBeInTheDocument();
    });

    it("should display character counter for project name", () => {
      render(<ProjectForm />);

      expect(screen.getByText("0 / 255 characters")).toBeInTheDocument();
    });

    it("should update character counter for name as user types", async () => {
      const user = userEvent.setup();
      render(<ProjectForm />);

      const nameInput = screen.getByLabelText(/project name/i);
      await user.type(nameInput, "Hello World");

      expect(screen.getByText("11 / 255 characters")).toBeInTheDocument();
    });

    it("should update character counter as user types", async () => {
      const user = userEvent.setup();
      render(<ProjectForm />);

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, "Hello World");

      expect(screen.getByText("11 / 2000 characters")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call createProject API with correct data", async () => {
      const user = userEvent.setup();
      const mockProject = {
        id: 1,
        name: "Test Project",
        description: "Test Description",
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (api.createProject as jest.Mock).mockResolvedValue(mockProject);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.type(
        screen.getByLabelText(/description/i),
        "Test Description"
      );
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(api.createProject).toHaveBeenCalledWith({
          name: "Test Project",
          description: "Test Description",
          status: "planned",
        });
      });
    });

    it("should show success message after successful submission", async () => {
      const user = userEvent.setup();
      const mockProject = {
        id: 1,
        name: "Test Project",
        description: null,
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (api.createProject as jest.Mock).mockResolvedValue(mockProject);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/project "test project" created successfully!/i)
        ).toBeInTheDocument();
      });
    });

    it("should reset form after successful submission", async () => {
      const user = userEvent.setup();
      const mockProject = {
        id: 1,
        name: "Test Project",
        description: "Test Description",
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (api.createProject as jest.Mock).mockResolvedValue(mockProject);

      render(<ProjectForm />);

      const titleInput = screen.getByLabelText(
        /project name/i
      ) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(
        /description/i
      ) as HTMLTextAreaElement;

      await user.type(titleInput, "Test Project");
      await user.type(descriptionInput, "Test Description");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(titleInput.value).toBe("");
        expect(descriptionInput.value).toBe("");
      });
    });

    it("should call onSuccess callback after successful submission", async () => {
      const user = userEvent.setup();
      const onSuccess = jest.fn();
      const mockProject = {
        id: 1,
        name: "Test Project",
        description: null,
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (api.createProject as jest.Mock).mockResolvedValue(mockProject);

      render(<ProjectForm onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      // Wait for the 1.5s delay before callback
      await waitFor(
        () => {
          expect(onSuccess).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it("should disable form during submission", async () => {
      const user = userEvent.setup();

      // Mock API to delay response
      (api.createProject as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");

      const submitButton = screen.getByRole("button", {
        name: /create project/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByRole("button", { name: /creating.../i })
      ).toBeDisabled();
    });

    it("should disable submit button while submitting", async () => {
      const user = userEvent.setup();

      // Mock API to delay response
      (api.createProject as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: 1,
                  name: "Test Project",
                  description: null,
                  status: "planned",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }),
              100
            )
          )
      );

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");

      const submitButton = screen.getByRole("button", {
        name: /create project/i,
      });

      // Click the submit button
      await user.click(submitButton);

      // Button should be disabled while submitting
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/creating/i);

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
      });

      // Form should be reset and button enabled (due to empty name field)
      expect(screen.getByLabelText(/project name/i)).toHaveValue("");
    });
  });

  describe("Error Handling", () => {
    it("should display field-specific error for duplicate project name (409)", async () => {
      const user = userEvent.setup();

      // Create a proper ApiError instance for 409 error
      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Conflict";
      apiError.status = 409;
      apiError.details = { detail: "Project already exists" };
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText(
            /a project with this name already exists\. please choose a different name\./i
          )
        ).toBeInTheDocument();
      });
    });

    it("should display API-level error for validation errors (400)", async () => {
      const user = userEvent.setup();

      // Create a proper ApiError instance for 400 error (validation)
      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Invalid input data";
      apiError.status = 400;
      apiError.details = { detail: "Validation failed" };
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText(/invalid input data/i)
        ).toBeInTheDocument();
      });
    });

    it("should display name field error with proper ARIA attributes", async () => {
      const user = userEvent.setup();

      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Conflict";
      apiError.status = 409;
      apiError.details = { detail: "Duplicate name" };
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/project name/i);
        expect(nameInput).toHaveAttribute("aria-invalid", "true");
        expect(nameInput).toHaveAttribute("aria-describedby", "name-error");
        expect(screen.getByRole("alert")).toHaveTextContent(
          /a project with this name already exists/i
        );
      });
    });

    it("should clear name error when user starts typing", async () => {
      const user = userEvent.setup();

      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Conflict";
      apiError.status = 409;
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/a project with this name already exists/i)
        ).toBeInTheDocument();
      });

      // Start typing to clear error
      await user.type(screen.getByLabelText(/project name/i), "2");

      await waitFor(() => {
        expect(
          screen.queryByText(/a project with this name already exists/i)
        ).not.toBeInTheDocument();
      });
    });

    it("should display user-friendly error message for 500 server errors", async () => {
      const user = userEvent.setup();

      // Create a proper ApiError instance for 500 error
      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Internal Server Error";
      apiError.status = 500;
      apiError.details = { detail: "Internal Server Error" };
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText("Server error. Please try again later.")
        ).toBeInTheDocument();
      });
    });

    it("should display user-friendly error message for network errors", async () => {
      const user = userEvent.setup();

      // Create a proper ApiError instance for network error (status 0)
      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Failed to connect to the API";
      apiError.status = 0;
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Failed to create project. Please check your connection and try again."
          )
        ).toBeInTheDocument();
      });
    });

    it("should keep form open after API error for retry", async () => {
      const user = userEvent.setup();

      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Internal Server Error";
      apiError.status = 500;
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Server error. Please try again later.")
        ).toBeInTheDocument();
      });

      // Form should remain open with values intact
      expect(screen.getByLabelText(/project name/i)).toHaveValue(
        "Test Project"
      );
      expect(
        screen.getByRole("button", { name: /create project/i })
      ).toBeInTheDocument();
    });

    it("should clear error message on successful retry", async () => {
      const user = userEvent.setup();

      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Internal Server Error";
      apiError.status = 500;
      apiError.name = "ApiError";

      const mockProject = {
        id: 1,
        name: "Test Project",
        description: null,
        status: "planned",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // First call fails, second succeeds
      (api.createProject as jest.Mock)
        .mockRejectedValueOnce(apiError)
        .mockResolvedValueOnce(mockProject);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      // First attempt shows error
      await waitFor(() => {
        expect(
          screen.getByText("Server error. Please try again later.")
        ).toBeInTheDocument();
      });

      // Retry
      await user.click(screen.getByRole("button", { name: /create project/i }));

      // Error should clear and success message should show
      await waitFor(() => {
        expect(
          screen.queryByText("Server error. Please try again later.")
        ).not.toBeInTheDocument();
        expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
      });
    });

    it("should display error message on API failure with object details", async () => {
      const user = userEvent.setup();

      // Create a proper ApiError instance
      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Bad Request";
      apiError.status = 400;
      apiError.details = { detail: "Project already exists" };
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(
        screen.getByLabelText(/project name/i),
        "Duplicate Project"
      );
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByText("Bad Request")).toBeInTheDocument();
      });
    });

    it("should display generic API error for other status codes", async () => {
      const user = userEvent.setup();

      // Create ApiError with other status code
      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Forbidden";
      apiError.status = 403;
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByText("Forbidden")).toBeInTheDocument();
      });
    });

    it("should handle duplicate title error specifically", async () => {
      const user = userEvent.setup();

      // Create a proper ApiError instance
      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Bad Request";
      apiError.status = 400;
      apiError.details = {
        detail:
          'Project with title "Test" already exists (case-insensitive match)',
      };
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(screen.getByText("Bad Request")).toBeInTheDocument();
      });
    });

    it("should show generic error for unexpected errors", async () => {
      const user = userEvent.setup();

      (api.createProject as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Failed to create project. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it("should have proper ARIA role for error messages", async () => {
      const user = userEvent.setup();

      const apiError = Object.create(api.ApiError.prototype);
      apiError.message = "Internal Server Error";
      apiError.status = 500;
      apiError.name = "ApiError";
      (api.createProject as jest.Mock).mockRejectedValue(apiError);

      render(<ProjectForm />);

      await user.type(screen.getByLabelText(/project name/i), "Test Project");
      await user.click(screen.getByRole("button", { name: /create project/i }));

      await waitFor(() => {
        const alertElement = screen.getByRole("alert");
        expect(alertElement).toBeInTheDocument();
        expect(alertElement).toHaveTextContent(
          "Server error. Please try again later."
        );
      });
    });
  });

  describe("Form Actions", () => {
    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<ProjectForm onCancel={onCancel} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalled();
    });

    it("should clear form when cancel is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<ProjectForm onCancel={onCancel} />);

      const titleInput = screen.getByLabelText(
        /project name/i
      ) as HTMLInputElement;
      await user.type(titleInput, "Test Project");
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(titleInput.value).toBe("");
    });
  });

  describe("Status Selection", () => {
    it('should default to "planned" status', () => {
      render(<ProjectForm />);

      const statusSelect = screen.getByLabelText(
        /status/i
      ) as HTMLSelectElement;
      expect(statusSelect.value).toBe("planned");
    });

    it("should allow changing status", async () => {
      const user = userEvent.setup();
      render(<ProjectForm />);

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, "in_progress");

      expect((statusSelect as HTMLSelectElement).value).toBe("in_progress");
    });
  });
});
