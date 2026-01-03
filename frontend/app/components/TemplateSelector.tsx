"use client";

import { useEffect, useRef, useState } from "react";
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

  const hasExistingTitle =
    currentTitle !== null && currentTitle.trim().length > 0;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadTemplates = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getTemplates("title");
        if (isMounted) {
          setTemplates(data);
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
  }, [isOpen]);

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
  }, [isOpen]);

  const closeAll = () => {
    setIsOpen(false);
    setShowConfirm(false);
    setSelectedTemplate(null);
    setIsApplying(false);
  };

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

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);

    if (hasExistingTitle) {
      setIsOpen(false);
      setShowConfirm(true);
    } else {
      void applyTemplate(template);
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
    if (selectedTemplate) {
      await applyTemplate(selectedTemplate);
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
      >
        📋
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-4"
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
                <a
                  href="/templates"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                >
                  Create your first template →
                </a>
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
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="template-overwrite-heading"
          className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 shadow-2xl p-4"
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
