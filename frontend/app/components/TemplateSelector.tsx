"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getTemplates } from "@/app/lib/api";
import { Template } from "@/app/types/template";

interface TemplateSelectorProps {
  currentTitle: string | null;
  onApply: (templateContent: string) => Promise<void>;
}

/**
 * TemplateSelector Component
 *
 * Dropdown/menu for selecting and applying title templates.
 * Shows confirmation dialog if current title will be overwritten.
 *
 * Z-index Strategy (coordinated with VideoTitleEditor):
 * - Dropdown menu: z-20
 * - Confirmation dialog: z-30
 * - VideoTitleEditor dialog: z-40 (always appears above TemplateSelector)
 */
export function TemplateSelector({
  currentTitle,
  onApply,
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  // Template caching: store last fetch time and cached templates to reduce API calls
  const cacheRef = useRef<{ templates: Template[]; timestamp: number } | null>(
    null
  );
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  const hasExistingTitle =
    currentTitle !== null && currentTitle.trim().length > 0;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadTemplates = async () => {
      // Check cache before making API call
      const now = Date.now();
      if (cacheRef.current && now - cacheRef.current.timestamp < CACHE_TTL) {
        setTemplates(cacheRef.current.templates);
        return; // Use cached data
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getTemplates("title");
        if (isMounted) {
          setTemplates(data);
          // Update cache with fresh data
          cacheRef.current = { templates: data, timestamp: now };
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
        if (isMounted) {
          setTemplates([]);
          setError("Unable to load templates. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTemplates();

    return () => {
      isMounted = false;
    };
  }, [isOpen, CACHE_TTL]);

  const closeAll = useCallback(() => {
    setIsOpen(false);
    setShowConfirm(false);
    setSelectedTemplate(null);
    setIsApplying(false);
    setError(null); // Clear error state when closing to avoid stale error messages
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeAll();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAll();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeAll]);

  // Focus management for confirmation dialog (accessibility improvement)
  useEffect(() => {
    if (!showConfirm) return;

    // Move focus to the Replace button when dialog opens
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowConfirm(false);
        setSelectedTemplate(null);
      }
      // Implement focus trap: prevent Tab from exiting dialog
      if (event.key === "Tab" && confirmDialogRef.current) {
        const focusableElements = confirmDialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
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
  }, [showConfirm]);

  const toggleDropdown = () => {
    if (isOpen) {
      closeAll();
    } else {
      setError(null);
      setShowConfirm(false);
      setSelectedTemplate(null);
      setIsOpen(true);
    }
  };

  const handleTemplateSelect = async (template: Template) => {
    setSelectedTemplate(template);

    if (hasExistingTitle) {
      setIsOpen(false);
      setShowConfirm(true);
    } else {
      await applyTemplate(template);
    }
  };

  const applyTemplate = async (template: Template) => {
    setIsApplying(true);
    setError(null);

    try {
      await onApply(template.content);
      closeAll();
    } catch (err) {
      console.error("Failed to apply template:", err);
      setError("Failed to apply template. Please try again.");
      setShowConfirm(hasExistingTitle);
      if (!hasExistingTitle) {
        setIsOpen(true);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleConfirmApply = async () => {
    // Prevent multiple concurrent apply operations from rapid "Replace" clicks
    // selectedTemplate is guaranteed to be non-null when this handler is called
    // because the confirmation dialog only appears after selecting a template
    if (!isApplying) {
      await applyTemplate(selectedTemplate!);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Apply template"
        title="Apply template"
      >
        <span aria-hidden="true" className="mr-1">
          📋
        </span>
        <span className="sr-only">Apply template</span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-4"
          role="menu"
          aria-label="Template list"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Apply Template
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pick a saved title to apply.
              </p>
            </div>
            <button
              type="button"
              onClick={closeAll}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Close
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <div className="mt-4 space-y-2" aria-live="polite">
            {loading ? (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>No templates available</p>
                <Link
                  href="/templates"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                >
                  Create your first template →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    disabled={isApplying}
                    className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {template.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Select
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 break-words">
                      {template.content}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={closeAll}
              className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showConfirm && selectedTemplate && (
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
              onClick={handleCancelConfirm}
              disabled={isApplying}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              ref={initialFocusRef}
              type="button"
              onClick={handleConfirmApply}
              disabled={isApplying}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? "Applying..." : "Replace"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
