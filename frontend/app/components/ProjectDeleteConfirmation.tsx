'use client';

import { useState, useEffect, useRef } from 'react';
import { Project } from '../types/project';

/**
 * Props for the ProjectDeleteConfirmation modal component
 * 
 * Related: Issue #13 - Delete confirmation modal
 */
interface ProjectDeleteConfirmationProps {
  /** Project to be deleted */
  project: Project | null;
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when user confirms deletion */
  onConfirm: (projectId: number) => Promise<void>;
  /** Callback when user cancels deletion */
  onCancel: () => void;
}

/**
 * ProjectDeleteConfirmation Modal Component
 * 
 * A reusable confirmation modal for safely deleting projects with:
 * - Clear warning messaging
 * - Loading states during deletion
 * - Error handling with retry capability
 * - Full keyboard and accessibility support
 * - Focus trap and ESC key handling
 * 
 * @example
 * ```tsx
 * <ProjectDeleteConfirmation
 *   project={projectToDelete}
 *   isOpen={isDeleteModalOpen}
 *   onConfirm={handleDeleteProject}
 *   onCancel={() => setIsDeleteModalOpen(false)}
 * />
 * ```
 * 
 * Related: Issue #13
 */
export default function ProjectDeleteConfirmation({
  project,
  isOpen,
  onConfirm,
  onCancel
}: ProjectDeleteConfirmationProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Handle the delete confirmation
   * Manages loading state, error handling, and calls the parent's onConfirm
   */
  const handleDelete = async () => {
    if (!project) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await onConfirm(project.id);
      // Parent handles post-delete actions (like closing modal)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      setIsDeleting(false);
    }
  };

  /**
   * Handle ESC key press to close modal
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onCancel]);

  /**
   * Focus management - focus cancel button when modal opens
   */
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  /**
   * Focus trap - keep focus within modal
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button:not(:disabled)'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  // Don't render if modal is closed or no project provided
  if (!isOpen || !project) return null;

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        ref={modalRef}
        data-testid="modal-content"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn"
        onKeyDown={handleKeyDown}
      >
        {/* Warning Icon and Title */}
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3
              id="modal-title"
              className="text-lg font-medium text-gray-900 dark:text-gray-100"
            >
              Delete Project?
            </h3>
          </div>
        </div>

        {/* Modal Description */}
        <div id="modal-description" className="mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Are you sure you want to delete{' '}
            <span className="font-semibold">"{project.name}"</span>?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. All project data will be permanently deleted.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
            role="alert"
          >
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            ref={deleteButtonRef}
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 border border-transparent rounded-md hover:bg-red-700 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isDeleting && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
