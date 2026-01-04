import { render, screen, fireEvent } from "@testing-library/react";
import TemplateFormModal from "../TemplateFormModal";
import { NormalizedTemplate } from "@/app/types/template";

// Mock the TemplateForm component
jest.mock("@/app/components/TemplateForm", () => {
  return function MockTemplateForm({
    mode,
    onSuccess,
    onCancel,
  }: {
    mode: "create" | "edit";
    onSuccess?: (template: unknown) => void;
    onCancel?: () => void;
  }) {
    return (
      <div data-testid={`form-${mode}`}>
        <button onClick={onCancel}>Cancel</button>
        <button
          onClick={() =>
            onSuccess?.({
              id: 1,
              type: "title",
              name: "Test Template",
              content: "Test content",
              workspace_id: 1,
              created_at: "2025-01-01T00:00:00Z",
              updated_at: "2025-01-01T00:00:00Z",
            })
          }
        >
          Submit
        </button>
      </div>
    );
  };
});

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

describe("TemplateFormModal", () => {
  it("should render create modal when isOpen is true in create mode", () => {
    render(
      <TemplateFormModal
        isOpen={true}
        mode="create"
        onSuccess={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("form-create")).toBeInTheDocument();
  });

  it("should render edit modal when isOpen is true in edit mode", () => {
    const template: NormalizedTemplate = {
      id: 1,
      type: "title",
      name: "Test Template",
      content: "Test content",
      workspace_id: 1,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };

    render(
      <TemplateFormModal
        isOpen={true}
        mode="edit"
        initialTemplate={template}
        onSuccess={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("form-edit")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <TemplateFormModal
        isOpen={false}
        mode="create"
        onSuccess={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByTestId("form-create")).not.toBeInTheDocument();
  });

  it("should call onSuccess when form is submitted", () => {
    const onSuccess = jest.fn();
    render(
      <TemplateFormModal
        isOpen={true}
        mode="create"
        onSuccess={onSuccess}
        onClose={jest.fn()}
      />
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitButton);

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Template",
      })
    );
  });

  it("should call onClose when form is cancelled", () => {
    const onClose = jest.fn();
    render(
      <TemplateFormModal
        isOpen={true}
        mode="create"
        onSuccess={jest.fn()}
        onClose={onClose}
      />
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
