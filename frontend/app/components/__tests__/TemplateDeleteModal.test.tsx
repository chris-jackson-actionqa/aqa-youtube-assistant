import { render, screen, fireEvent } from "@testing-library/react";
import TemplateDeleteModal from "../TemplateDeleteModal";
import { NormalizedTemplate } from "@/app/types/template";

// Mock Modal component
jest.mock("@/app/components/Modal", () => {
  return function MockModal({
    isOpen,
    children,
    onClose,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    onClose?: () => void;
  }) {
    if (!isOpen) return null;
    return (
      <div role="dialog" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>{children}</div>
      </div>
    );
  };
});

describe("TemplateDeleteModal", () => {
  const mockTemplate: NormalizedTemplate = {
    id: 1,
    type: "title",
    name: "Test Template",
    content: "Test content",
    workspace_id: 1,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  it("should render modal when isOpen is true and template exists", () => {
    render(
      <TemplateDeleteModal
        isOpen={true}
        template={mockTemplate}
        error={null}
        isDeleting={false}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/Test Template/)).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <TemplateDeleteModal
        isOpen={false}
        template={mockTemplate}
        error={null}
        isDeleting={false}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByText(/Test Template/)).not.toBeInTheDocument();
  });

  it("should not render when template is null", () => {
    render(
      <TemplateDeleteModal
        isOpen={true}
        template={null}
        error={null}
        isDeleting={false}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByText("Delete template")).not.toBeInTheDocument();
  });

  it("should display error message when error is provided", () => {
    render(
      <TemplateDeleteModal
        isOpen={true}
        template={mockTemplate}
        error="Failed to delete template"
        isDeleting={false}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText("Failed to delete template")).toBeInTheDocument();
  });

  it("should show loading state when isDeleting is true", () => {
    render(
      <TemplateDeleteModal
        isOpen={true}
        template={mockTemplate}
        error={null}
        isDeleting={true}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    const deleteButton = screen.getByRole("button", {
      name: /Deleting\.\.\./,
    });
    expect(deleteButton).toBeDisabled();
  });

  it("should call onConfirm when delete button is clicked", () => {
    const onConfirm = jest.fn();
    render(
      <TemplateDeleteModal
        isOpen={true}
        template={mockTemplate}
        error={null}
        isDeleting={false}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />
    );

    const deleteButton = screen.getByRole("button", {
      name: "Delete Template",
    });
    fireEvent.click(deleteButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it("should call onClose when cancel button is clicked", () => {
    const onClose = jest.fn();
    render(
      <TemplateDeleteModal
        isOpen={true}
        template={mockTemplate}
        error={null}
        isDeleting={false}
        onConfirm={jest.fn()}
        onClose={onClose}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("should pass correct props to Modal component", () => {
    render(
      <TemplateDeleteModal
        isOpen={true}
        template={mockTemplate}
        error={null}
        isDeleting={false}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    // Verify that the modal dialog appears (via the mock)
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
