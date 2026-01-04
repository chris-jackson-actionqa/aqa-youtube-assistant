import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../Modal";

describe("Modal Component", () => {
  it("should render when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} ariaLabel="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} ariaLabel="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });

  it("should call onClose when clicking the backdrop", () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} ariaLabel="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const backdrop = container.querySelector('[role="dialog"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(onClose).toHaveBeenCalled();
  });

  it("should not close when clicking inside the modal content", () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} ariaLabel="Test Modal">
        <button>Click me</button>
      </Modal>
    );

    const button = screen.getByRole("button", { name: "Click me" });
    fireEvent.click(button);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should have role=dialog and aria-modal=true", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={jest.fn()} ariaLabel="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("should apply maxWidth class", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={jest.fn()} maxWidth="lg" ariaLabel="Test">
        <p>Content</p>
      </Modal>
    );

    const content = container.querySelector(".max-w-lg");
    expect(content).toBeInTheDocument();
  });
});
