import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import ProjectDetailPage from "../page";
import * as api from "@/app/lib/api";
import { Project } from "@/app/types/project";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
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

const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("successful project fetch", () => {
    beforeEach(() => {
      mockGetProject.mockResolvedValue(mockProject);
    });

    it("renders main element with role", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
    });

    it("renders project name as h1", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const heading = screen.getByRole("heading", {
        level: 1,
        name: "Test Project",
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders project description", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText("Test project description")).toBeInTheDocument();
    });

    it("renders status badge with proper styling", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const status = screen.getByText("In Progress");
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass("bg-yellow-100", "text-yellow-800");
    });

    it("status badge has accessibility label", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const status = screen.getByLabelText("Project status: In Progress");
      expect(status).toBeInTheDocument();
    });

    it("renders formatted created date", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText("Created")).toBeInTheDocument();
      // Check that date is formatted (contains month name) - use getAllByText since both dates have month names
      const datesWithMonths = screen.getAllByText(
        /January|February|March|April|May|June/
      );
      expect(datesWithMonths.length).toBeGreaterThan(0);
    });

    it("renders formatted updated date", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText("Last Updated")).toBeInTheDocument();
    });

    it("renders project ID", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText("Project ID")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("calls getProject with correct ID", async () => {
      await ProjectDetailPage({ params: Promise.resolve({ id: "1" }) });
      expect(mockGetProject).toHaveBeenCalledWith(1);
    });

    it("uses semantic HTML structure", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      expect(container.querySelector("main")).toBeInTheDocument();
      expect(container.querySelector("article")).toBeInTheDocument();
      expect(container.querySelector("header")).toBeInTheDocument();
      expect(container.querySelectorAll("section")).toHaveLength(2);
    });

    it("renders description section heading", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const heading = screen.getByRole("heading", {
        level: 2,
        name: "Description",
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders details section heading", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const heading = screen.getByRole("heading", {
        level: 2,
        name: "Details",
      });
      expect(heading).toBeInTheDocument();
    });

    it("renders with container and max-width styling", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const main = container.querySelector("main");
      expect(main).toHaveClass("container", "mx-auto", "max-w-4xl");
    });

    it("article has card styling", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const article = container.querySelector("article");
      expect(article).toHaveClass(
        "rounded-lg",
        "border",
        "bg-white",
        "shadow-sm"
      );
    });

    it("uses definition list for metadata", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const dl = container.querySelector("dl");
      expect(dl).toBeInTheDocument();
      expect(container.querySelectorAll("dt")).toHaveLength(3);
      expect(container.querySelectorAll("dd")).toHaveLength(3);
    });

    it("renders responsive grid for details", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const dl = container.querySelector("dl");
      expect(dl).toHaveClass("grid", "grid-cols-1", "sm:grid-cols-2");
    });
  });

  describe("back navigation", () => {
    beforeEach(() => {
      mockGetProject.mockResolvedValue(mockProject);
    });

    it("renders back to projects link", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink).toBeInTheDocument();
    });

    it("back link has correct href", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink).toHaveAttribute("href", "/projects");
    });

    it("back link has visible text 'Back to Projects'", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText("Back to Projects")).toBeInTheDocument();
    });

    it("back link has arrow icon", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink.textContent).toContain("←");
      
      // Verify arrow is in a span with aria-hidden
      const arrowSpan = container.querySelector('span[aria-hidden="true"]');
      expect(arrowSpan).toBeInTheDocument();
      expect(arrowSpan?.textContent).toBe("← ");
    });

    it("back link has proper accessibility label", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const backLink = screen.getByLabelText("Back to projects list");
      expect(backLink).toBeInTheDocument();
    });

    it("back link has hover styles", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink).toHaveClass(
        "text-blue-600",
        "hover:text-blue-800",
        "hover:underline"
      );
    });

    it("back link has focus styles", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink).toHaveClass(
        "focus:outline-none",
        "focus:ring-2",
        "focus:ring-blue-500",
        "focus:ring-offset-2"
      );
    });

    it("back link has transition for smooth hover effect", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink).toHaveClass("transition-colors", "duration-200");
    });

    it("back link is positioned above project article", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      const article = container.querySelector("article");

      // Check that back link has margin-bottom
      expect(backLink).toHaveClass("mb-4");

      // Verify both elements exist
      expect(backLink).toBeInTheDocument();
      expect(article).toBeInTheDocument();
    });

    it("back link uses inline-flex for proper icon alignment", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const backLink = screen.getByRole("link", { name: /back to projects/i });
      expect(backLink).toHaveClass("inline-flex", "items-center");
    });

    it("back link is rendered before project details", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const main = container.querySelector("main");
      const firstChild = main?.firstChild;

      // The back link should be the first child (before the article)
      expect(firstChild?.nodeName).toBe("A");
    });
  });

  describe("null description handling", () => {
    it("renders placeholder when description is null", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        description: null,
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const placeholder = screen.getByText("No description provided");
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass("italic", "text-gray-500");
    });

    it("renders placeholder when description is empty string", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        description: "",
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const placeholder = screen.getByText("No description provided");
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe("status formatting", () => {
    it("formats planned status", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "planned",
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const status = screen.getByText("Planned");
      expect(status).toHaveClass("bg-blue-100", "text-blue-800");
    });

    it("formats in_progress status", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "in_progress",
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const status = screen.getByText("In Progress");
      expect(status).toHaveClass("bg-yellow-100", "text-yellow-800");
    });

    it("formats completed status", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "completed",
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const status = screen.getByText("Completed");
      expect(status).toHaveClass("bg-green-100", "text-green-800");
    });

    it("formats archived status", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "archived",
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const status = screen.getByText("Archived");
      expect(status).toHaveClass("bg-gray-100", "text-gray-800");
    });

    it("handles unknown status with default styling", async () => {
      mockGetProject.mockResolvedValue({
        ...mockProject,
        status: "unknown_status",
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const status = screen.getByText("Unknown Status");
      expect(status).toHaveClass("bg-gray-100", "text-gray-800");
    });
  });

  describe("404 handling", () => {
    it("calls notFound when ID is not a number", async () => {
      mockNotFound.mockImplementation(() => {
        throw new Error("NEXT_NOT_FOUND");
      });

      await expect(
        ProjectDetailPage({ params: Promise.resolve({ id: "abc" }) })
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalled();
    });

    it("calls notFound when getProject throws error", async () => {
      mockGetProject.mockRejectedValue(new Error("Project not found"));
      mockNotFound.mockImplementation(() => {
        throw new Error("NEXT_NOT_FOUND");
      });

      await expect(
        ProjectDetailPage({ params: Promise.resolve({ id: "99999" }) })
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalled();
    });

    it("calls notFound when ID is negative", async () => {
      mockNotFound.mockImplementation(() => {
        throw new Error("NEXT_NOT_FOUND");
      });

      await expect(
        ProjectDetailPage({ params: Promise.resolve({ id: "-1" }) })
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalled();
    });

    it("calls notFound when ID is empty string", async () => {
      mockNotFound.mockImplementation(() => {
        throw new Error("NEXT_NOT_FOUND");
      });

      await expect(
        ProjectDetailPage({ params: Promise.resolve({ id: "" }) })
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalled();
    });

    it("calls notFound when ID contains non-numeric characters", async () => {
      mockNotFound.mockImplementation(() => {
        throw new Error("NEXT_NOT_FOUND");
      });

      await expect(
        ProjectDetailPage({ params: Promise.resolve({ id: "12abc" }) })
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalled();
    });

    it("calls notFound when ID is decimal number", async () => {
      mockNotFound.mockImplementation(() => {
        throw new Error("NEXT_NOT_FOUND");
      });

      await expect(
        ProjectDetailPage({ params: Promise.resolve({ id: "12.5" }) })
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalled();
    });
  });

  describe("date formatting", () => {
    beforeEach(() => {
      mockGetProject.mockResolvedValue(mockProject);
    });

    it("formats date with month name", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      // Check that formatted dates appear (month names are a good indicator)
      const text = container.textContent || "";
      expect(
        /January|February|March|April|May|June|July|August|September|October|November|December/.test(
          text
        )
      ).toBe(true);
    });

    it("formats date with year", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const text = container.textContent || "";
      expect(text).toContain("2024");
    });

    it("formats date with time", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      const text = container.textContent || "";
      // Check for time pattern (e.g., "10:30 AM" or "2:45 PM")
      expect(/\d{1,2}:\d{2}\s*(AM|PM)/i.test(text)).toBe(true);
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      mockGetProject.mockResolvedValue(mockProject);
    });

    it("has proper heading hierarchy", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      const h1 = screen.getAllByRole("heading", { level: 1 });
      const h2 = screen.getAllByRole("heading", { level: 2 });

      expect(h1).toHaveLength(1);
      expect(h2.length).toBeGreaterThan(0);
    });

    it("uses semantic HTML elements", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      expect(container.querySelector("main")).toBeInTheDocument();
      expect(container.querySelector("article")).toBeInTheDocument();
      expect(container.querySelector("header")).toBeInTheDocument();
      expect(container.querySelectorAll("section").length).toBeGreaterThan(0);
    });

    it("uses dl/dt/dd for metadata", async () => {
      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      const { container } = render(component);

      expect(container.querySelector("dl")).toBeInTheDocument();
      expect(container.querySelectorAll("dt").length).toBeGreaterThan(0);
      expect(container.querySelectorAll("dd").length).toBeGreaterThan(0);
    });
  });

  describe("large ID numbers", () => {
    it("handles large project IDs", async () => {
      const largeId = 999999999;
      mockGetProject.mockResolvedValue({
        ...mockProject,
        id: largeId,
      });

      await ProjectDetailPage({
        params: Promise.resolve({ id: largeId.toString() }),
      });
      expect(mockGetProject).toHaveBeenCalledWith(largeId);
    });
  });

  describe("edge cases", () => {
    it("handles project with very long name", async () => {
      const longName = "A".repeat(200);
      mockGetProject.mockResolvedValue({
        ...mockProject,
        name: longName,
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("handles project with very long description", async () => {
      const longDescription = "B".repeat(1000);
      mockGetProject.mockResolvedValue({
        ...mockProject,
        description: longDescription,
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it("handles special characters in name", async () => {
      const specialName = "Test & Project <With> \"Special\" 'Characters'";
      mockGetProject.mockResolvedValue({
        ...mockProject,
        name: specialName,
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it("handles special characters in description", async () => {
      const specialDesc =
        "Description with <html> & \"quotes\" & 'apostrophes'";
      mockGetProject.mockResolvedValue({
        ...mockProject,
        description: specialDesc,
      });

      const component = await ProjectDetailPage({
        params: Promise.resolve({ id: "1" }),
      });
      render(component);

      expect(screen.getByText(specialDesc)).toBeInTheDocument();
    });
  });
});
