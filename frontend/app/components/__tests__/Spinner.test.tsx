import { render, screen } from "@testing-library/react";
import Spinner from "../Spinner";

describe("Spinner", () => {
  it("renders with default props", () => {
    render(<Spinner />);

    // Check for the status role
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();

    // Check for default screen reader text
    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<Spinner label="Creating project" />);

    expect(screen.getByText("Creating project")).toBeInTheDocument();
  });

  it("renders with custom size", () => {
    render(<Spinner size={30} label="Testing" />);

    const svg = screen.getByRole("status").querySelector("svg");
    expect(svg).toHaveAttribute("width", "30");
    expect(svg).toHaveAttribute("height", "30");
  });

  it("renders with custom color", () => {
    render(<Spinner color="text-blue-500" label="Testing" />);

    const svg = screen.getByRole("status").querySelector("svg");
    expect(svg).toHaveClass("text-blue-500");
  });

  it("has role status which implies aria-live polite for accessibility", () => {
    render(<Spinner />);

    const spinner = screen.getByRole("status");
    // role="status" implicitly has aria-live="polite" per ARIA spec
    expect(spinner).toBeInTheDocument();
  });

  it("hides SVG from screen readers", () => {
    render(<Spinner />);

    const svg = screen.getByRole("status").querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("has screen reader only text", () => {
    render(<Spinner label="Loading content" />);

    const srText = screen.getByText("Loading content");
    expect(srText).toHaveClass("sr-only");
  });

  it("applies animation class", () => {
    render(<Spinner />);

    const svg = screen.getByRole("status").querySelector("svg");
    expect(svg).toHaveClass("animate-spin");
  });

  it("renders all props together", () => {
    render(
      <Spinner size={25} color="text-red-600" label="Processing request" />
    );

    const spinner = screen.getByRole("status");
    const svg = spinner.querySelector("svg");

    expect(svg).toHaveAttribute("width", "25");
    expect(svg).toHaveAttribute("height", "25");
    expect(svg).toHaveClass("text-red-600");
    expect(screen.getByText("Processing request")).toBeInTheDocument();
  });
});
