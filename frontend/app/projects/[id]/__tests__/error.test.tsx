/**
 * Unit tests for Error component
 *
 * Tests cover:
 * - Component rendering with error details
 * - Reset functionality
 * - Accessibility attributes
 * - Navigation links
 * - Error message display
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Error from "../error";

describe("Error", () => {
  const mockError: Error & { digest?: string } = {
    name: "Error",
    message: "Test error message",
  };
  const mockReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders error boundary component", () => {
      render(<Error error={mockError} reset={mockReset} />);

      expect(
        screen.getByRole("heading", { name: /something went wrong/i })
      ).toBeInTheDocument();
    });

    it("renders with error message", () => {
      render(<Error error={mockError} reset={mockReset} />);

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("renders without error message when error has no message", () => {
      const errorWithoutMessage: Error & { digest?: string } = {
        name: "Error",
        message: "",
      };

      render(<Error error={errorWithoutMessage} reset={mockReset} />);

      expect(
        screen.getByText(/We encountered an error while loading/i)
      ).toBeInTheDocument();
    });

    it("renders error digest when provided", () => {
      const errorWithDigest: Error & { digest?: string } = {
        ...mockError,
        digest: "abc123",
      };

      render(<Error error={errorWithDigest} reset={mockReset} />);

      expect(screen.getByText(/Error ID: abc123/i)).toBeInTheDocument();
    });

    it("does not render error digest section when not provided", () => {
      const errorWithoutDigest: Error & { digest?: string } = {
        ...mockError,
        digest: undefined,
      };

      render(<Error error={errorWithoutDigest} reset={mockReset} />);

      expect(screen.queryByText(/Error ID:/i)).not.toBeInTheDocument();
    });
  });

  describe("Reset Functionality", () => {
    it("calls reset function when Try Again button is clicked", async () => {
      const user = userEvent.setup();
      render(<Error error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      await user.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("renders Try Again button with proper styling", () => {
      render(<Error error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      expect(tryAgainButton).toHaveClass("bg-red-600");
      expect(tryAgainButton).toHaveClass("text-white");
    });
  });

  describe("Navigation", () => {
    it("renders link to projects page", () => {
      render(<Error error={mockError} reset={mockReset} />);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute("href", "/projects");
    });

    it("back to projects link has proper styling", () => {
      render(<Error error={mockError} reset={mockReset} />);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink).toHaveClass("border");
      expect(backLink).toHaveClass("bg-white");
    });
  });

  describe("Accessibility", () => {
    it("has proper role and aria attributes", () => {
      render(<Error error={mockError} reset={mockReset} />);

      const errorContainer = screen.getByRole("alert");
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveAttribute("aria-live", "assertive");
    });

    it("error icon is hidden from screen readers", () => {
      const { container } = render(<Error error={mockError} reset={mockReset} />);

      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it("Try Again button is keyboard accessible", () => {
      render(<Error error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      expect(tryAgainButton).not.toHaveAttribute("disabled");
      tryAgainButton.focus();
      expect(tryAgainButton).toHaveFocus();
    });

    it("Back to Projects link is keyboard accessible", () => {
      render(<Error error={mockError} reset={mockReset} />);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      backLink.focus();
      expect(backLink).toHaveFocus();
    });
  });

  describe("Help Text", () => {
    it("displays troubleshooting suggestions", () => {
      render(<Error error={mockError} reset={mockReset} />);

      expect(
        screen.getByText(/If the problem persists/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The backend server is running/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/You have an active internet connection/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/The project ID in the URL is correct/i)
      ).toBeInTheDocument();
    });

    it("renders help text as a list", () => {
      const { container } = render(<Error error={mockError} reset={mockReset} />);

      const helpList = container.querySelector("ul");
      expect(helpList).toBeInTheDocument();

      const listItems = container.querySelectorAll("ul li");
      expect(listItems.length).toBe(3);
    });
  });

  describe("Visual Design", () => {
    it("uses red color scheme for error state", () => {
      const { container } = render(<Error error={mockError} reset={mockReset} />);

      const mainContainer = container.querySelector(".bg-red-50");
      expect(mainContainer).toBeInTheDocument();

      const border = container.querySelector(".border-red-200");
      expect(border).toBeInTheDocument();
    });

    it("renders error icon SVG", () => {
      const { container } = render(<Error error={mockError} reset={mockReset} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-red-600");
    });

    it("displays error details in a separate section", () => {
      render(<Error error={mockError} reset={mockReset} />);

      expect(screen.getByText(/Error Details:/i)).toBeInTheDocument();
    });
  });

  describe("Error Message Handling", () => {
    it("handles long error messages", () => {
      const longMessage = "A".repeat(500);
      const longError: Error & { digest?: string } = {
        name: "Error",
        message: longMessage,
      };

      render(<Error error={longError} reset={mockReset} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("handles special characters in error message", () => {
      const specialCharsError: Error & { digest?: string } = {
        name: "Error",
        message: 'Error: <script>alert("test")</script>',
      };

      render(<Error error={specialCharsError} reset={mockReset} />);

      // React escapes HTML by default, so the script tag should be rendered as text
      expect(
        screen.getByText(/Error: <script>alert\("test"\)<\/script>/i)
      ).toBeInTheDocument();
    });

    it("handles error with digest containing special characters", () => {
      const errorWithSpecialDigest: Error & { digest?: string } = {
        ...mockError,
        digest: "abc-123_xyz.456",
      };

      render(<Error error={errorWithSpecialDigest} reset={mockReset} />);

      expect(screen.getByText(/Error ID: abc-123_xyz.456/i)).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("renders within main container with proper classes", () => {
      const { container } = render(<Error error={mockError} reset={mockReset} />);

      const mainElement = container.querySelector("main");
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass("container", "mx-auto", "max-w-4xl");
    });

    it("renders action buttons in a flex container", () => {
      const { container } = render(<Error error={mockError} reset={mockReset} />);

      // Find the div containing both buttons
      const buttonsContainer = container.querySelector(".flex.flex-wrap.gap-3");
      expect(buttonsContainer).toBeInTheDocument();

      // Check both button and link are in the container
      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      const backLink = screen.getByRole("link", { name: /back to projects/i });

      expect(buttonsContainer).toContainElement(tryAgainButton);
      expect(buttonsContainer).toContainElement(backLink);
    });

    it("uses proper spacing classes", () => {
      const { container } = render(<Error error={mockError} reset={mockReset} />);

      const mainCard = container.querySelector(".p-8");
      expect(mainCard).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("renders without crashing when error is null-ish", () => {
      const emptyError: Error & { digest?: string } = {
        name: "Error",
        message: "",
      };
      expect(() => render(<Error error={emptyError} reset={mockReset} />)).not.toThrow();
    });

    it("handles multiple clicks on Try Again button", async () => {
      const user = userEvent.setup();
      render(<Error error={mockError} reset={mockReset} />);

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });

      await user.click(tryAgainButton);
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalledTimes(3);
    });

    it("renders consistently across multiple renders", () => {
      const { rerender } = render(<Error error={mockError} reset={mockReset} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();

      rerender(<Error error={mockError} reset={mockReset} />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
