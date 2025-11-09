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

    it("renders project description", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Test project description")
        ).toBeInTheDocument();
      });
    });

    it("renders status badge with proper styling", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const status = screen.getByText("In Progress");
        expect(status).toBeInTheDocument();
        expect(status).toHaveClass("bg-yellow-100", "text-yellow-800");
      });
    });

    it("status badge has accessibility label", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const status = screen.getByLabelText("Project status: In Progress");
        expect(status).toBeInTheDocument();
      });
    });

    it("renders formatted created date", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Created")).toBeInTheDocument();
        const datesWithMonths = screen.getAllByText(
          /January|February|March|April|May|June/
        );
        expect(datesWithMonths.length).toBeGreaterThan(0);
      });
    });

    it("renders formatted updated date", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Last Updated")).toBeInTheDocument();
      });
    });

    it("renders project ID", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Project ID")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
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
        expect(container.querySelector("article")).toBeInTheDocument();
        expect(container.querySelector("header")).toBeInTheDocument();
        expect(container.querySelectorAll("section")).toHaveLength(2);
      });
    });

    it("renders description section heading", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const heading = screen.getByRole("heading", {
          level: 2,
          name: "Description",
        });
        expect(heading).toBeInTheDocument();
      });
    });

    it("renders details section heading", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const heading = screen.getByRole("heading", {
          level: 2,
          name: "Details",
        });
        expect(heading).toBeInTheDocument();
      });
    });

    it("renders with container and max-width styling", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const main = container.querySelector("main");
        expect(main).toHaveClass("container", "mx-auto", "max-w-4xl");
      });
    });

    it("article has card styling", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const article = container.querySelector("article");
        expect(article).toHaveClass(
          "rounded-lg",
          "border",
          "bg-white",
          "shadow-sm"
        );
      });
    });

    it("uses definition list for metadata", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const dl = container.querySelector("dl");
        expect(dl).toBeInTheDocument();
        expect(container.querySelectorAll("dt")).toHaveLength(3);
        expect(container.querySelectorAll("dd")).toHaveLength(3);
      });
    });

    it("renders responsive grid for details", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const dl = container.querySelector("dl");
        expect(dl).toHaveClass("grid", "grid-cols-1", "sm:grid-cols-2");
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

    it("back link has hover styles", async () => {
      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toHaveClass(
          "text-blue-600",
          "hover:text-blue-800",
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

    it("back link is positioned above project article", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        const article = container.querySelector("article");

        expect(backLink).toHaveClass("mb-4");
        expect(backLink).toBeInTheDocument();
        expect(article).toBeInTheDocument();
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

  describe("null description handling", () => {
    it("renders placeholder when description is null", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        description: null,
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const placeholder = screen.getByText("No description provided");
        expect(placeholder).toBeInTheDocument();
        expect(placeholder).toHaveClass("italic", "text-gray-500");
      });
    });

    it("renders placeholder when description is empty string", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        description: "",
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const placeholder = screen.getByText("No description provided");
        expect(placeholder).toBeInTheDocument();
      });
    });
  });

  describe("status formatting", () => {
    it("formats planned status", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "planned",
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const status = screen.getByText("Planned");
        expect(status).toHaveClass("bg-blue-100", "text-blue-800");
      });
    });

    it("formats in_progress status", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "in_progress",
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const status = screen.getByText("In Progress");
        expect(status).toHaveClass("bg-yellow-100", "text-yellow-800");
      });
    });

    it("formats completed status", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "completed",
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const status = screen.getByText("Completed");
        expect(status).toHaveClass("bg-green-100", "text-green-800");
      });
    });

    it("formats archived status", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "archived",
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const status = screen.getByText("Archived");
        expect(status).toHaveClass("bg-gray-100", "text-gray-800");
      });
    });

    it("handles unknown status with default styling", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "unknown_status",
      });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const status = screen.getByText("Unknown Status");
        expect(status).toHaveClass("bg-gray-100", "text-gray-800");
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

    it("404 page has back link to /projects", async () => {
      mockUseParams.mockReturnValue({ id: "invalid" });

      render(<ProjectDetailPage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to projects/i,
        });
        expect(backLink).toHaveAttribute("href", "/projects");
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
        const h2 = screen.getAllByRole("heading", { level: 2 });

        expect(h1).toHaveLength(1);
        expect(h2.length).toBeGreaterThan(0);
      });
    });

    it("uses semantic HTML elements", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(container.querySelector("main")).toBeInTheDocument();
        expect(container.querySelector("article")).toBeInTheDocument();
        expect(container.querySelector("header")).toBeInTheDocument();
        expect(container.querySelectorAll("section").length).toBeGreaterThan(0);
      });
    });

    it("uses dl/dt/dd for metadata", async () => {
      const { container } = render(<ProjectDetailPage />);

      await waitFor(() => {
        expect(container.querySelector("dl")).toBeInTheDocument();
        expect(container.querySelectorAll("dt").length).toBeGreaterThan(0);
        expect(container.querySelectorAll("dd").length).toBeGreaterThan(0);
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

      await waitFor(() => {
        expect(screen.getByText(longDescription)).toBeInTheDocument();
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

      await waitFor(() => {
        expect(screen.getByText(specialDesc)).toBeInTheDocument();
      });
    });
  });
});
