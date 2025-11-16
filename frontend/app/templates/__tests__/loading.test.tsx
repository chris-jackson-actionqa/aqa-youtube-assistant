/**
 * Unit tests for Templates loading component
 * Tests loading skeleton UI
 *
 * Related: Issue #172 - Create Templates Page Route and Navigation
 */

import { render, screen } from "@testing-library/react";
import TemplatesLoading from "../loading";

describe("TemplatesLoading", () => {
  it("should render loading skeleton", () => {
    render(<TemplatesLoading />);

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("should have proper semantic structure", () => {
    const { container } = render(<TemplatesLoading />);

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
  });

  it("should render skeleton placeholders for templates", () => {
    const { container } = render(<TemplatesLoading />);

    // Should have multiple skeleton items (3 in this case)
    const skeletonItems = container.querySelectorAll(".rounded-lg.border");
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  it("should have animate-pulse classes for loading animation", () => {
    const { container } = render(<TemplatesLoading />);

    const animatedElements = container.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it("should match the layout structure of the actual page", () => {
    const { container } = render(<TemplatesLoading />);

    // Should have back link skeleton
    const backLinkSkeleton = container.querySelector(".mb-6.h-6");
    expect(backLinkSkeleton).toBeInTheDocument();

    // Should have header skeleton
    const headerSkeletons = container.querySelectorAll("header .animate-pulse");
    expect(headerSkeletons.length).toBeGreaterThan(0);

    // Should have filter skeleton
    const filterSkeleton = container.querySelector(".mb-6 .h-10");
    expect(filterSkeleton).toBeInTheDocument();

    // Should have templates list skeleton
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
  });

  it("should support dark mode classes", () => {
    const { container } = render(<TemplatesLoading />);

    const darkModeElements = container.querySelectorAll(".dark\\:bg-gray-900");
    expect(darkModeElements.length).toBeGreaterThan(0);
  });
});
