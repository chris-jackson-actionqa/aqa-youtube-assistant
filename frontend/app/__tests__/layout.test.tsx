/**
 * Unit tests for RootLayout component
 * Tests navigation structure and Templates link
 *
 * Related: Issue #172 - Create Templates Page Route and Navigation
 */

import { render } from "@testing-library/react";
import RootLayout from "../layout";

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock WorkspaceSelector component
jest.mock("../components/workspace/WorkspaceSelector", () => {
  const MockWorkspaceSelector = () => (
    <div data-testid="workspace-selector">Workspace Selector</div>
  );
  MockWorkspaceSelector.displayName = "MockWorkspaceSelector";
  return MockWorkspaceSelector;
});

// Mock WorkspaceContext
jest.mock("../contexts/WorkspaceContext", () => ({
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="workspace-provider">{children}</div>
  ),
}));

// Mock ProjectContext
jest.mock("../contexts/ProjectContext", () => ({
  ProjectProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="project-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  const mockChildren = <div data-testid="mock-children">Test Content</div>;

  beforeEach(() => {
    // Suppress expected console errors from rendering html in test
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render children content", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    // Find in the entire container since html/body are rendered
    expect(
      container.querySelector('[data-testid="mock-children"]')
    ).toBeInTheDocument();
  });

  it("should wrap content in WorkspaceProvider", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    expect(
      container.querySelector('[data-testid="workspace-provider"]')
    ).toBeInTheDocument();
  });

  it("should wrap content in ProjectProvider", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    expect(
      container.querySelector('[data-testid="project-provider"]')
    ).toBeInTheDocument();
  });

  it("should render WorkspaceSelector in header", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    expect(
      container.querySelector('[data-testid="workspace-selector"]')
    ).toBeInTheDocument();
  });

  it("should render application title as link", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const titleLink = container.querySelector('a[href="/"]');
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveTextContent("YouTube Assistant");
  });

  it("should render Templates navigation link", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const templatesLink = container.querySelector('a[href="/templates"]');
    expect(templatesLink).toBeInTheDocument();
    expect(templatesLink).toHaveTextContent("Templates");
  });

  it("should have navigation with proper ARIA label", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const nav = container.querySelector('nav[aria-label="Main navigation"]');
    expect(nav).toBeInTheDocument();
  });

  it("should have navigation as an unordered list", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const nav = container.querySelector("nav");
    const ul = nav?.querySelector("ul");
    expect(ul).toBeInTheDocument();
  });

  it("should have navigation links in list items", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const nav = container.querySelector("nav");
    const li = nav?.querySelector("li");
    expect(li).toBeInTheDocument();
  });

  it("should have header with banner role", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("should have main content with proper id", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const main = container.querySelector("main#main-content");
    expect(main).toBeInTheDocument();
  });

  it("should have sticky header", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const header = container.querySelector("header");
    expect(header).toHaveClass("sticky");
  });

  it("should support dark mode styles", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const header = container.querySelector("header");
    expect(header).toHaveClass("dark:bg-gray-900");
  });

  it("should have focus states on navigation links", () => {
    const { container } = render(<RootLayout>{mockChildren}</RootLayout>);

    const templatesLink = container.querySelector('a[href="/templates"]');
    expect(templatesLink).toHaveClass("focus:outline-none");
    expect(templatesLink).toHaveClass("focus:ring-2");
  });
});
