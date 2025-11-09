/**
 * Unit tests for Loading component
 *
 * Tests cover:
 * - Component rendering
 * - Accessibility attributes
 * - Skeleton structure matching page layout
 * - Screen reader announcements
 */

import { render, screen } from "@testing-library/react";
import Loading from "../loading";

describe("Loading", () => {
  describe("Rendering", () => {
    it("renders loading skeleton", () => {
      render(<Loading />);

      // Check for status role indicating loading state
      const loadingContainer = screen.getByRole("status");
      expect(loadingContainer).toBeInTheDocument();
    });

    it("renders main container with proper structure", () => {
      const { container } = render(<Loading />);

      const mainElement = container.querySelector("main");
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass("container", "mx-auto", "max-w-4xl");
    });

    it("renders header skeleton elements", () => {
      const { container } = render(<Loading />);

      // Header should have title and status badge skeletons
      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();

      // Count skeleton elements in header (title + badge)
      const headerSkeletons = header?.querySelectorAll(".animate-pulse");
      expect(headerSkeletons?.length).toBe(2);
    });

    it("renders description section skeleton", () => {
      const { container } = render(<Loading />);

      // Find description section skeletons
      const sections = container.querySelectorAll("section");
      expect(sections.length).toBeGreaterThanOrEqual(2);

      // Description section should have multiple line skeletons
      const descriptionSection = sections[0];
      const lineSkeletons = descriptionSection.querySelectorAll(
        ".space-y-2 > .animate-pulse"
      );
      expect(lineSkeletons.length).toBe(3); // 3 lines of text
    });

    it("renders metadata section skeleton", () => {
      const { container } = render(<Loading />);

      // Find metadata section (second section)
      const sections = container.querySelectorAll("section");
      const metadataSection = sections[1];

      // Should have definition list with grid
      const dl = metadataSection.querySelector("dl");
      expect(dl).toBeInTheDocument();
      expect(dl).toHaveClass("grid");

      // Should have metadata items (Created, Updated, ID) - direct children only
      const metadataItems = dl?.querySelectorAll(":scope > div");
      expect(metadataItems?.length).toBe(3);
    });
  });

  describe("Accessibility", () => {
    it("has proper role and aria attributes", () => {
      render(<Loading />);

      const loadingContainer = screen.getByRole("status");
      expect(loadingContainer).toHaveAttribute("aria-live", "polite");
      expect(loadingContainer).toHaveAttribute(
        "aria-label",
        "Loading project details"
      );
    });

    it("includes screen reader text for loading state", () => {
      render(<Loading />);

      const srText = screen.getByText(/Loading project details, please wait/i);
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass("sr-only");
    });

    it("announces loading state to screen readers", () => {
      const { container } = render(<Loading />);

      const statusElement = container.querySelector('[role="status"]');
      expect(statusElement).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("Skeleton Animation", () => {
    it("applies pulse animation to all skeleton elements", () => {
      const { container } = render(<Loading />);

      const skeletonElements = container.querySelectorAll(".animate-pulse");
      expect(skeletonElements.length).toBeGreaterThan(0);

      // All skeleton elements should have the animate-pulse class
      skeletonElements.forEach((element) => {
        expect(element).toHaveClass("animate-pulse");
      });
    });

    it("uses consistent gray color for skeleton elements", () => {
      const { container } = render(<Loading />);

      const skeletonElements = container.querySelectorAll(".animate-pulse");
      skeletonElements.forEach((element) => {
        expect(element).toHaveClass("bg-gray-200");
      });
    });
  });

  describe("Layout Structure", () => {
    it("matches the page layout with proper sections", () => {
      const { container } = render(<Loading />);

      // Should have header
      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();

      // Should have sections for description and metadata
      const sections = container.querySelectorAll("section");
      expect(sections.length).toBe(2);
    });

    it("has responsive classes for different screen sizes", () => {
      const { container } = render(<Loading />);

      const dl = container.querySelector("dl");
      expect(dl).toHaveClass("sm:grid-cols-2");
    });

    it("maintains proper spacing and borders", () => {
      const { container } = render(<Loading />);

      const mainCard = container.querySelector(".rounded-lg");
      expect(mainCard).toHaveClass(
        "border",
        "border-gray-200",
        "bg-white",
        "shadow-sm"
      );

      const header = container.querySelector("header");
      expect(header).toHaveClass("border-b", "border-gray-200");
    });
  });

  describe("Skeleton Dimensions", () => {
    it("renders skeletons with appropriate widths", () => {
      const { container } = render(<Loading />);

      // Title should be 3/4 width
      const header = container.querySelector("header");
      const titleSkeleton = header?.querySelector(".h-9");
      expect(titleSkeleton).toHaveClass("w-3/4");

      // Status badge should be fixed width
      const badgeSkeleton = header?.querySelector(".h-7");
      expect(badgeSkeleton).toHaveClass("w-24");
    });

    it("renders skeletons with appropriate heights", () => {
      const { container } = render(<Loading />);

      // Check various skeleton heights
      const h9Element = container.querySelector(".h-9");
      expect(h9Element).toBeInTheDocument();

      const h7Element = container.querySelector(".h-7");
      expect(h7Element).toBeInTheDocument();

      const h5Elements = container.querySelectorAll(".h-5");
      expect(h5Elements.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("renders without errors when mounted multiple times", () => {
      const { rerender } = render(<Loading />);
      expect(screen.getByRole("status")).toBeInTheDocument();

      rerender(<Loading />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders consistently across multiple renders", () => {
      const { container: container1 } = render(<Loading />);
      const { container: container2 } = render(<Loading />);

      const skeletons1 = container1.querySelectorAll(".animate-pulse");
      const skeletons2 = container2.querySelectorAll(".animate-pulse");

      expect(skeletons1.length).toBe(skeletons2.length);
    });
  });
});
