import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  ariaLabel?: string;
}

/**
 * Reusable Modal Component
 *
 * Provides consistent styling and behavior for modal dialogs across the application.
 * Features:
 * - Fixed backdrop with z-index management
 * - Responsive sizing with configurable max-width
 * - Click-outside-to-close functionality
 * - Accessibility features (role, aria-modal, aria-label)
 * - Dark mode support
 * - Proper scrolling for content overflow
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   title="Delete Item"
 *   maxWidth="lg"
 *   ariaLabel="Delete confirmation dialog"
 * >
 *   <p>Are you sure?</p>
 *   <button onClick={handleDelete}>Delete</button>
 * </Modal>
 * ```
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "2xl",
  ariaLabel,
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
