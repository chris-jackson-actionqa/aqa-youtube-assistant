import TemplateForm from "@/app/components/TemplateForm";
import Modal from "@/app/components/Modal";
import { NormalizedTemplate, Template } from "@/app/types/template";

interface TemplateFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialTemplate?: NormalizedTemplate;
  onSuccess: (template: Template) => void;
  onClose: () => void;
}

/**
 * Template Form Modal Component
 *
 * Wraps the TemplateForm component in a reusable modal dialog.
 * Handles create and edit modes with optional pre-filled data.
 *
 * Features:
 * - Modal overlay with consistent styling
 * - Support for create (empty form) and edit (pre-filled) modes
 * - Success and cancel callbacks
 * - Keyboard navigation (Escape to close)
 * - Responsive sizing
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <TemplateFormModal
 *   isOpen={showForm}
 *   mode="create"
 *   onSuccess={handleSuccess}
 *   onClose={handleClose}
 * />
 *
 * <TemplateFormModal
 *   isOpen={showEdit}
 *   mode="edit"
 *   initialTemplate={template}
 *   onSuccess={handleSuccess}
 *   onClose={handleClose}
 * />
 * ```
 */
export default function TemplateFormModal({
  isOpen,
  mode,
  initialTemplate,
  onSuccess,
  onClose,
}: TemplateFormModalProps) {
  const title = mode === "create" ? "Create New Template" : "Edit Template";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="2xl"
      ariaLabel={title}
    >
      <TemplateForm
        mode={mode}
        initialTemplate={initialTemplate}
        onSuccess={onSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}
