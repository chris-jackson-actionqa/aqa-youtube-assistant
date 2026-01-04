import { render, screen, fireEvent } from "@testing-library/react";
import FilterButton from "../FilterButton";

describe("FilterButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render button with label and count", () => {
      render(
        <FilterButton
          label="All"
          count={5}
          isActive={false}
          onClick={mockOnClick}
        />
      );

      expect(
        screen.getByRole("button", { name: "All (5)" })
      ).toBeInTheDocument();
    });

    it("should render with custom position", () => {
      const { container } = render(
        <FilterButton
          label="Title"
          count={3}
          isActive={false}
          onClick={mockOnClick}
          position="first"
        />
      );

      const button = container.querySelector("button");
      expect(button).not.toHaveClass("border-l");
    });

    it("should apply border for middle position", () => {
      const { container } = render(
        <FilterButton
          label="Title"
          count={3}
          isActive={false}
          onClick={mockOnClick}
          position="middle"
        />
      );

      const button = container.querySelector("button");
      expect(button).toHaveClass("border-l");
    });

    it("should apply border for last position", () => {
      const { container } = render(
        <FilterButton
          label="Description"
          count={2}
          isActive={false}
          onClick={mockOnClick}
          position="last"
        />
      );

      const button = container.querySelector("button");
      expect(button).toHaveClass("border-l");
    });
  });

  describe("Active State", () => {
    it("should show active styles when isActive is true", () => {
      const { container } = render(
        <FilterButton
          label="All"
          count={5}
          isActive={true}
          onClick={mockOnClick}
        />
      );

      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-blue-600");
      expect(button).toHaveClass("text-white");
    });

    it("should show inactive styles when isActive is false", () => {
      const { container } = render(
        <FilterButton
          label="All"
          count={5}
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = container.querySelector("button");
      expect(button).toHaveClass("bg-white");
      expect(button).toHaveClass("dark:bg-gray-800");
    });

    it("should have aria-pressed=true when active", () => {
      render(
        <FilterButton
          label="All"
          count={5}
          isActive={true}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("should have aria-pressed=false when inactive", () => {
      render(
        <FilterButton
          label="All"
          count={5}
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("Interactions", () => {
    it("should call onClick when clicked", () => {
      render(
        <FilterButton
          label="All"
          count={5}
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("should be keyboard accessible", () => {
      render(
        <FilterButton
          label="All"
          count={5}
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();
    });
  });

  describe("Count Display", () => {
    it("should display zero count", () => {
      render(
        <FilterButton
          label="Title"
          count={0}
          isActive={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText(/\(0\)/)).toBeInTheDocument();
    });

    it("should display large count", () => {
      render(
        <FilterButton
          label="All"
          count={999}
          isActive={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText(/\(999\)/)).toBeInTheDocument();
    });
  });
});
