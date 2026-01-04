"use client";

import { useEffect, useRef } from "react";
import { Template } from "@/app/types/template";

interface TemplateConfirmDialogProps {
  selectedTemplate: Template;
  currentTitle: string | null;
  isApplying: boolean;
  error: string | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * TemplateConfirmDialog Component
 *
 * Displays a confirmation dialog when applying a template over an existing title.
 * Implements focus management and focus trap for accessibility.
 *
 * This is a presentational component that delegates state management
 * to the parent TemplateSelector component.
 */
export function TemplateConfirmDialog({
  selectedTemplate,
  currentTitle,
  isApplying,
  error,
  onConfirm,
  onCancel,
}: TemplateConfirmDialogProps) {
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  // Focus management for confirmation dialog (accessibility improvement)
  useEffect(() => {
    // Move focus to the Replace button when dialog opens
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
      // Implement focus trap: prevent Tab from exiting dialog
      if (event.key === "Tab" && confirmDialogRef.current) {
        const focusableElements = confirmDialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        // This guard clause is defensive programming. In practice, this dialog always
        // has at least 2 focusable buttons (Cancel and Replace), so this condition
        // will never be true. We keep it for robustness in case the dialog structure changes.
        // istanbul ignore next
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;
        const activeElement = document.activeElement;

        if (event.shiftKey) {
          // Shift+Tab on first element -> focus last element
          if (activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab on last element -> focus first element
          if (activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      ref={confirmDialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="template-overwrite-heading"
      className="absolute left-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] min-w-0 rounded-lg border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 shadow-2xl p-4"
    >
      <h3
        id="template-overwrite-heading"
        className="text-base font-semibold text-gray-900 dark:text-gray-100"
      >
        Replace existing video title?
      </h3>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        This will overwrite:
      </p>
      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
        &ldquo;{currentTitle}&rdquo;
      </p>

      {error && (
        <div
          role="alert"
          className="mt-3 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isApplying}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          ref={initialFocusRef}
          type="button"
          onClick={onConfirm}
          disabled={isApplying}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApplying ? "Applying..." : "Replace"}
        </button>
      </div>
    </div>
  );
}
