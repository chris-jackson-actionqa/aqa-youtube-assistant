import { useRef, useEffect } from "react";
import Modal from "@/app/components/Modal";
import useModalKeyboardHandler from "@/app/hooks/useModalKeyboardHandler";
import { NormalizedTemplate } from "@/app/types/template";

interface TemplateDeleteModalProps {
  isOpen: boolean;
  template: NormalizedTemplate | null;
  error: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Template Delete Confirmation Modal Component
 *
 * Displays a confirmation dialog before deleting a template.
 * Handles user confirmation, error states, and loading states.
 *
 * Features:
 * - Confirmation dialog with template name
 * - Error message display
 * - Loading state during deletion
 * - Focus management (initial focus on Cancel button)
 * - Keyboard navigation (Escape to close)
 * - Accessibility features (role, aria-live for errors)
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <TemplateDeleteModal
 *   isOpen={showDelete}
 *   template={selectedTemplate}
 *   error={deleteError}
 *   isDeleting={deleting}
 *   onConfirm={handleDelete}
 *   onClose={handleClose}
 * />
 * ```
 */
export default function TemplateDeleteModal({
  isOpen,
  template,
  error,
  isDeleting,
  onConfirm,
  onClose,
}: TemplateDeleteModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  // Focus on cancel button when modal opens
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Use keyboard handler hook for Escape key
  useModalKeyboardHandler(isOpen, onClose);

  if (!template) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Template"
      maxWidth="lg"
      ariaLabel="Delete template confirmation"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Delete template
      </h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Are you sure you want to delete &quot;{template.name}&quot;? This action
        cannot be undone.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          ref={cancelButtonRef}
          onClick={onClose}
          className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
        >
          {isDeleting ? "Deleting..." : "Delete Template"}
        </button>
      </div>
    </Modal>
  );
}
