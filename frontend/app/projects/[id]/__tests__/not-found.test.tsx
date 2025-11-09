import { render, screen } from "@testing-library/react";
import NotFound from "../not-found";

describe("NotFound", () => {
  it("renders main element with proper role", () => {
    render(<NotFound />);

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("renders 404 heading", () => {
    render(<NotFound />);

    const heading = screen.getByText("404");
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe("H1");
    expect(heading).toHaveClass("text-6xl", "font-bold");
  });

  it("renders project not found title", () => {
    render(<NotFound />);

    const title = screen.getByText("Project Not Found");
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe("H2");
  });

  it("renders descriptive error message", () => {
    render(<NotFound />);

    const message = screen.getByText(
      /The project you're looking for doesn't exist or may have been deleted/i
    );
    expect(message).toBeInTheDocument();
  });

  it("has alert role for accessibility", () => {
    render(<NotFound />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("aria-live", "polite");
    expect(alert).toHaveAttribute("aria-atomic", "true");
  });

  it("renders link back to projects list", () => {
    render(<NotFound />);

    const link = screen.getByRole("link", {
      name: /navigate back to projects list/i,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/projects");
  });

  it("link has proper accessibility label", () => {
    render(<NotFound />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label", "Navigate back to projects list");
  });

  it("link displays back to projects text", () => {
    render(<NotFound />);

    expect(screen.getByText("Back to Projects")).toBeInTheDocument();
  });

  it("link has proper button styling", () => {
    render(<NotFound />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass(
      "bg-blue-600",
      "hover:bg-blue-700",
      "focus:ring-2",
      "focus:ring-blue-500"
    );
  });

  it("link has focus styling for keyboard navigation", () => {
    render(<NotFound />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass(
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-offset-2"
    );
  });

  it("renders back arrow SVG icon", () => {
    render(<NotFound />);

    const link = screen.getByRole("link");
    const svg = link.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("centers content on page", () => {
    render(<NotFound />);

    const main = screen.getByRole("main");
    expect(main).toHaveClass(
      "flex",
      "min-h-screen",
      "items-center",
      "justify-center"
    );
  });

  it("content container has max width", () => {
    render(<NotFound />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("max-w-md", "text-center");
  });

  it("has responsive padding", () => {
    render(<NotFound />);

    const main = screen.getByRole("main");
    expect(main).toHaveClass("p-4");
  });

  it("renders all elements in correct order", () => {
    const { container } = render(<NotFound />);

    const headings = container.querySelectorAll("h1, h2");
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("404");
    expect(headings[1]).toHaveTextContent("Project Not Found");

    const paragraph = container.querySelector("p");
    expect(paragraph).toBeInTheDocument();

    const link = container.querySelector("a");
    expect(link).toBeInTheDocument();
  });

  it("link has inline-flex display for icon alignment", () => {
    render(<NotFound />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("inline-flex", "items-center", "gap-2");
  });

  it("applies proper spacing between elements", () => {
    render(<NotFound />);

    const h1 = screen.getByText("404");
    const h2 = screen.getByText("Project Not Found");
    const paragraph = screen.getByText(
      /The project you're looking for doesn't exist/
    );

    expect(h1).toHaveClass("mb-4");
    expect(h2).toHaveClass("mb-4");
    expect(paragraph).toHaveClass("mb-8");
  });

  it("has proper text color hierarchy", () => {
    render(<NotFound />);

    const h1 = screen.getByText("404");
    const h2 = screen.getByText("Project Not Found");
    const paragraph = screen.getByText(
      /The project you're looking for doesn't exist/
    );

    expect(h1).toHaveClass("text-gray-800");
    expect(h2).toHaveClass("text-gray-700");
    expect(paragraph).toHaveClass("text-gray-600");
  });

  it("link has transition for smooth hover effect", () => {
    render(<NotFound />);

    const link = screen.getByRole("link");
    expect(link).toHaveClass("transition-colors", "duration-200");
  });

  it("svg has proper stroke settings", () => {
    render(<NotFound />);

    const link = screen.getByRole("link");
    const svg = link.querySelector("svg");
    const path = svg?.querySelector("path");

    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("fill", "none");
    expect(path).toHaveAttribute("stroke-linecap", "round");
    expect(path).toHaveAttribute("stroke-linejoin", "round");
    expect(path).toHaveAttribute("stroke-width", "2");
  });
});
