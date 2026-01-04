import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../Button";

describe("Button Component", () => {
  describe("Rendering", () => {
    it("should render with default props", () => {
      render(<Button>Click me</Button>);
      expect(
        screen.getByRole("button", { name: "Click me" })
      ).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      const { container } = render(
        <Button className="custom-class">Button</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("custom-class");
    });

    it("should pass through HTML button attributes", () => {
      render(
        <Button type="submit" aria-label="Submit form">
          Submit
        </Button>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toHaveAttribute("aria-label", "Submit form");
    });
  });

  describe("Variants", () => {
    it("should render primary variant", () => {
      const { container } = render(<Button variant="primary">Primary</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-blue-600");
      expect(button).toHaveClass("text-white");
    });

    it("should render secondary variant", () => {
      const { container } = render(
        <Button variant="secondary">Secondary</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("bg-white");
    });

    it("should render danger variant", () => {
      const { container } = render(<Button variant="danger">Danger</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-red-600");
      expect(button).toHaveClass("text-white");
    });

    it("should render outline-danger variant", () => {
      const { container } = render(
        <Button variant="outline-danger">Outline Danger</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("border-red-200");
      expect(button).toHaveClass("text-red-700");
    });

    it("should render outline-primary variant", () => {
      const { container } = render(
        <Button variant="outline-primary">Outline Primary</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("border-blue-200");
      expect(button).toHaveClass("text-blue-700");
    });
  });

  describe("Sizes", () => {
    it("should render small size", () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("px-3");
      expect(button).toHaveClass("py-1");
      expect(button).toHaveClass("text-sm");
    });

    it("should render medium size (default)", () => {
      const { container } = render(<Button>Medium</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
      expect(button).toHaveClass("text-sm");
    });

    it("should render large size", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
      expect(button).toHaveClass("text-base");
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should apply disabled styling for primary variant", () => {
      const { container } = render(
        <Button variant="primary" disabled>
          Disabled
        </Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("disabled:opacity-70");
    });

    it("should apply disabled styling for danger variant", () => {
      const { container } = render(
        <Button variant="danger" disabled>
          Disabled
        </Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("disabled:opacity-70");
    });
  });

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not call onClick when disabled", () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should be keyboard accessible", () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to button element", () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe("BUTTON");
    });

    it("should allow focusing via ref", () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<Button ref={ref}>Button</Button>);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe("Accessibility", () => {
    it("should have focus ring classes", () => {
      const { container } = render(<Button>Button</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-2");
    });

    it("should have proper role", () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
