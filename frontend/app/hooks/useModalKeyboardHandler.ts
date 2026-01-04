import { useEffect } from "react";

/**
 * Hook for handling keyboard events in modals
 *
 * Provides consistent keyboard behavior for modal dialogs:
 * - Escape key closes the modal
 * - Can be extended for other keyboard shortcuts (Enter, etc.)
 *
 * Features:
 * - Automatic cleanup of event listeners
 * - Respects modal open/closed state
 * - No-op when modal is closed
 *
 * @example
 * ```tsx
 * function MyModal({ isOpen, onClose }) {
 *   useModalKeyboardHandler(isOpen, onClose);
 *
 *   return (
 *     <Modal isOpen={isOpen} onClose={onClose}>
 *       {content}
 *     </Modal>
 *   );
 * }
 * ```
 *
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback function to call when Escape key is pressed
 */
export default function useModalKeyboardHandler(
  isOpen: boolean,
  onClose: () => void
): void {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);
}
