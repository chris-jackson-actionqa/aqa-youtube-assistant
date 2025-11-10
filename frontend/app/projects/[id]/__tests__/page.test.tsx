import { render, screen, waitFor, act } from "@testing-library/react";
import { useParams, useRouter } from "next/navigation";
import ProjectDetailPage from "../page";
import * as api from "@/app/lib/api";
import { Project } from "@/app/types/project";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
  MockLink.displayName = "Link";
  return MockLink;
});

// Mock API functions
jest.mock("@/app/lib/api", () => ({
  getProject: jest.fn(),
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockGetProject = api.getProject as jest.MockedFunction<
  typeof api.getProject
>;

describe("ProjectDetailPage", () => {
  const mockProject: Project = {
    id: 1,
    name: "Test Project",
    description: "Test project description",
    status: "in_progress",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-02-20T14:45:00Z",
  };

  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseParams.mockReturnValue({ id: "1" });
  });

  describe("Loading state", () => {
    it("shows loading state initially", () => {
      mockGetProject.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ProjectDetailPage />);

      expect(
        screen.getByText("Loading project details...")
      ).toBeInTheDocument();
    });
  });

  describe("Valid project ID - successful fetch", () => {
    beforeEach(() => {
      mockGetProject.mockResolvedValue(mockProject);
    });

    it("renders main element with role", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole("main")).toBeInTheDocument();
      });
    });

    it("renders project name as h1", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const heading = screen.getByRole("heading", {
          level: 1,
          name: "Test Project",
        });
        expect(heading).toBeInTheDocument();
      });
    });

    it("renders formatted created date", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
        const datesWithMonths = screen.getAllByText(
          /January|February|March|April|May|June/
        );
        expect(datesWithMonths.length).toBeGreaterThan(0);
      });
    });

    it("renders formatted updated date", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Updated:/)).toBeInTheDocument();
      });
    });

    it("calls getProject with correct ID", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledWith(1);
      });
    });

    it("uses semantic HTML structure", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(container.querySelector("main")).toBeInTheDocument();
        expect(container.querySelector("header")).toBeInTheDocument();
      });
    });

    it("renders with container and max-width styling", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const main = container.querySelector("main");
        expect(main).toHaveClass("max-w-6xl", "mx-auto");
      });
    });

    it("has consistent page background styling with main page", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const pageWrapper = container.querySelector(".min-h-screen");
        expect(pageWrapper).toHaveClass(
          "bg-gray-50",
          "dark:bg-gray-900",
          "font-sans"
        );
      });
    });

    it("header has proper spacing", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const header = container.querySelector("header");
        expect(header).toHaveClass("mb-6");
      });
    });

    it("project title has large bold styling", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const title = screen.getByRole("heading", { level: 1 });
        expect(title).toHaveClass(
          "text-4xl",
          "font-bold",
          "mb-4",
          "text-gray-900",
          "dark:text-gray-100"
        );
      });
    });

    it("metadata section has proper text styling", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const metadata = container.querySelector(".text-gray-600");
        expect(metadata).toHaveClass(
          "text-gray-600",
          "dark:text-gray-400",
          "space-y-1"
        );
      });
    });

    it("created date has font-medium emphasis", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const createdLabel = Array.from(
          container.querySelectorAll(".font-medium")
        ).find((el) => el.textContent === "Created:");
        expect(createdLabel).toBeInTheDocument();
      });
    });

    it("updated date has font-medium emphasis", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const updatedLabel = Array.from(
          container.querySelectorAll(".font-medium")
        ).find((el) => el.textContent === "Updated:");
        expect(updatedLabel).toBeInTheDocument();
      });
    });
  });

  describe("back navigation", () => {
    beforeEach(() => {
      mockGetProject.mockResolvedValue(mockProject);
    });

    it("renders back to projects link", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toBeInTheDocument();
      });
    });

    it("back link has correct href", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toHaveAttribute("href", "/");
      });
    });

    it("back link has visible text 'Back to Projects'", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Back to Projects")).toBeInTheDocument();
      });
    });

    it("back link has arrow icon", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink.textContent).toContain("←");

        const arrowSpan = container.querySelector('span[aria-hidden="true"]');
        expect(arrowSpan).toBeInTheDocument();
        expect(arrowSpan?.textContent).toBe("← ");
      });
    });

    it("back link has proper accessibility label", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByLabelText("Back to projects list");
        expect(backLink).toBeInTheDocument();
      });
    });

    it("back link has hover styles with dark mode support", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toHaveClass(
          "text-blue-600",
          "dark:text-blue-400",
          "hover:text-blue-800",
          "dark:hover:text-blue-300",
          "hover:underline"
        );
      });
    });

    it("back link has focus styles", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toHaveClass(
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-blue-500",
          "focus:ring-offset-2"
        );
      });
    });

    it("back link has transition for smooth hover effect", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toHaveClass("transition-colors", "duration-200");
      });
    });

    it("back link is positioned above project content", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });

        expect(backLink).toHaveClass("mb-6");
        expect(backLink).toBeInTheDocument();
      });
    });

    it("back link uses inline-flex for proper icon alignment", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toHaveClass("inline-flex", "items-center");
      });
    });

    it("back link is rendered before project details", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const main = container.querySelector("main");
        const firstChild = main?.firstChild;
        expect(firstChild?.nodeName).toBe("A");
      });
    });
  });

  describe("404 handling - invalid IDs", () => {
    it("shows 404 when ID is not a number", async () => {
      mockUseParams.mockReturnValue({ id: "abc" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "404", level: 1 })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "Project Not Found", level: 2 })
        ).toBeInTheDocument();
      });
    });

    it("shows 404 when ID is negative", async () => {
      mockUseParams.mockReturnValue({ id: "-1" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "404", level: 1 })
        ).toBeInTheDocument();
      });
    });

    it("shows 404 when ID is zero", async () => {
      mockUseParams.mockReturnValue({ id: "0" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "404", level: 1 })
        ).toBeInTheDocument();
      });
    });

    it("shows 404 when ID is empty string", async () => {
      mockUseParams.mockReturnValue({ id: "" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "404", level: 1 })
        ).toBeInTheDocument();
      });
    });

    it("shows 404 when ID contains non-numeric characters", async () => {
      mockUseParams.mockReturnValue({ id: "12abc" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "404", level: 1 })
        ).toBeInTheDocument();
      });
    });

    it("shows 404 when ID is decimal number", async () => {
      mockUseParams.mockReturnValue({ id: "12.5" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "404", level: 1 })
        ).toBeInTheDocument();
      });
    });

    it("404 error has proper accessibility attributes", async () => {
      mockUseParams.mockReturnValue({ id: "invalid" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute("aria-live", "polite");
      });
    });

    it("404 page has back link to home", async () => {
      mockUseParams.mockReturnValue({ id: "invalid" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toHaveAttribute("href", "/");
      });
    });
  });

  describe("404 handling - fetch errors", () => {
    it("shows 404 when getProject throws error", async () => {
      mockGetProject.mockRejectedValue(new Error("Project not found"));

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "404", level: 1 })
        ).toBeInTheDocument();
        expect(
          screen.getByText(/doesn't exist or may have been deleted/)
        ).toBeInTheDocument();
      });
    });

    it("404 page shows error message about deletion", async () => {
      mockGetProject.mockRejectedValue(new Error("Not found"));

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            /The project you're looking for doesn't exist or may have been deleted./
          )
        ).toBeInTheDocument();
      });
    });

    it("404 page has consistent background styling", async () => {
      mockGetProject.mockRejectedValue(new Error("Not found"));
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const pageWrapper = container.querySelector(".min-h-screen");
        expect(pageWrapper).toHaveClass(
          "bg-gray-50",
          "dark:bg-gray-900",
          "font-sans"
        );
      });
    });

    it("404 alert has dark mode styling", async () => {
      mockGetProject.mockRejectedValue(new Error("Not found"));
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveClass(
          "border-red-200",
          "dark:border-red-800",
          "bg-red-50",
          "dark:bg-red-900/30"
        );
      });
    });
  });

  describe("date formatting", () => {
    beforeEach(() => {
      mockGetProject.mockResolvedValue(mockProject);
    });

    it("formats date with month name", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const text = container.textContent || "";
        expect(
          /January|February|March|April|May|June|July|August|September|October|November|December/.test(
            text
          )
        ).toBe(true);
      });
    });

    it("formats date with year", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const text = container.textContent || "";
        expect(text).toContain("2024");
      });
    });

    it("formats date with time", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const text = container.textContent || "";
        expect(/\d{1,2}:\d{2}\s*(AM|PM)/i.test(text)).toBe(true);
      });
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      mockGetProject.mockResolvedValue(mockProject);
    });

    it("has proper heading hierarchy", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const h1 = screen.getAllByRole("heading", { level: 1 });
        expect(h1).toHaveLength(1);
      });
    });

    it("uses semantic HTML elements", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(container.querySelector("main")).toBeInTheDocument();
        expect(container.querySelector("header")).toBeInTheDocument();
      });
    });

    it("has sufficient color contrast for text", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const title = screen.getByRole("heading", { level: 1 });
        expect(title).toHaveClass("text-gray-900", "dark:text-gray-100");

        const metadata = container.querySelector(".text-gray-600");
        expect(metadata).toHaveClass("text-gray-600", "dark:text-gray-400");
      });
    });
  });

  describe("large ID numbers", () => {
    it("handles large project IDs", async () => {
      const largeId = 999999999;
      mockUseParams.mockReturnValue({ id: largeId.toString() });
      mockGetProject.mockResolvedValue({
        ...mockProject,
        id: largeId,
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(mockGetProject).toHaveBeenCalledWith(largeId);
      });
    });
  });

  describe("edge cases", () => {
    it("handles project with very long name", async () => {
      const longName = "A".repeat(200);
      mockGetProject.mockResolvedValue({
        ...mockProject,
        name: longName,
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it("handles project with very long description", async () => {
      const longDescription = "B".repeat(1000);
      mockGetProject.mockResolvedValue({
        ...mockProject,
        description: longDescription,
      });

      render(<ProjectDetailPage />);

      // Just verify it renders without error
      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      });
    });

    it("handles special characters in name", async () => {
      const specialName = "Test & Project <With> \"Special\" 'Characters'";
      mockGetProject.mockResolvedValue({
        ...mockProject,
        name: specialName,
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(specialName)).toBeInTheDocument();
      });
    });

    it("handles special characters in description", async () => {
      const specialDesc =
        "Description with <html> & \"quotes\" & 'apostrophes'";
      mockGetProject.mockResolvedValue({
        ...mockProject,
        description: specialDesc,
      });

      render(<ProjectDetailPage />);

      // Just verify it renders without error
      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      });
    });
  });
});
