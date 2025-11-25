/**
 * Unit tests for Templates error component
 * Tests error display and retry functionality
 *
 * Related: Issue #172 - Create Templates Page Route and Navigation
 */

import { render, screen, fireEvent } from "@testing-library/react";
import TemplatesError from "../error";

// Mock next/link
jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
      className,
      "aria-label": ariaLabel,
    }: {
      children: React.ReactNode;
      href: string;
      className?: string;
      "aria-label"?: string;
    }) => {
      return (
        <a href={href} className={className} aria-label={ariaLabel}>
          {children}
        </a>
      );
    },
  };
});

describe("TemplatesError", () => {
  const mockReset = jest.fn();
  const mockError = new Error("Test error message");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render error heading", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    expect(
      screen.getByRole("heading", { name: "Something went wrong!", level: 1 })
    ).toBeInTheDocument();
  });

  it("should display error message", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should display default message when error has no message", () => {
    const errorWithoutMessage = new Error();
    render(<TemplatesError error={errorWithoutMessage} reset={mockReset} />);

    expect(
      screen.getByText("An unexpected error occurred while loading templates.")
    ).toBeInTheDocument();
  });

  it("should render Try Again button", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    expect(
      screen.getByRole("button", { name: "Retry loading templates" })
    ).toBeInTheDocument();
  });

  it("should render Go to Home link", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    const homeLink = screen.getByRole("link", { name: "Go back to home page" });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("should call reset function when Try Again button clicked", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByRole("button", {
      name: "Retry loading templates",
    });
    fireEvent.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("should have role=alert on error container", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    const errorAlert = screen.getByRole("alert");
    expect(errorAlert).toBeInTheDocument();
  });

  it("should have aria-live=polite on error container", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    const errorAlert = screen.getByRole("alert");
    expect(errorAlert).toHaveAttribute("aria-live", "polite");
  });

  it("should have accessible button labels", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByRole("button", {
      name: "Retry loading templates",
    });
    expect(tryAgainButton).toHaveAccessibleName();

    const homeLink = screen.getByRole("link", { name: "Go back to home page" });
    expect(homeLink).toHaveAccessibleName();
  });

  it("should render main semantic element", () => {
    render(<TemplatesError error={mockError} reset={mockReset} />);

    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("should support dark mode classes", () => {
    const { container } = render(
      <TemplatesError error={mockError} reset={mockReset} />
    );

    const darkModeElements = container.querySelectorAll(".dark\\:bg-gray-900");
    expect(darkModeElements.length).toBeGreaterThan(0);
  });

  it("should have consistent styling with other error pages", () => {
    const { container } = render(
      <TemplatesError error={mockError} reset={mockReset} />
    );

    // Check for red-themed error styling
    const redBorderedElement = container.querySelector(".border-red-200");
    expect(redBorderedElement).toBeInTheDocument();

    const redBackgroundElement = container.querySelector(".bg-red-50");
    expect(redBackgroundElement).toBeInTheDocument();
  });

  it("should handle errors with digest property", () => {
    const errorWithDigest = Object.assign(new Error("Test error"), {
      digest: "abc123",
    });

    render(<TemplatesError error={errorWithDigest} reset={mockReset} />);

    expect(screen.getByText("Test error")).toBeInTheDocument();
  });
});
