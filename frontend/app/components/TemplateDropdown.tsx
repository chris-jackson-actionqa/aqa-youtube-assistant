"use client";

import Link from "next/link";
import { Template } from "@/app/types/template";

interface TemplateDropdownProps {
  templates: Template[];
  loading: boolean;
  error: string | null;
  isApplying: boolean;
  onTemplateSelect: (template: Template) => void;
  onClose: () => void;
}

/**
 * TemplateDropdown Component
 *
 * Displays a dropdown menu with available templates.
 * Handles loading, error, and empty states.
 *
 * This is a presentational component that delegates all state management
 * to the parent TemplateSelector component.
 */
export function TemplateDropdown({
  templates,
  loading,
  error,
  isApplying,
  onTemplateSelect,
  onClose,
}: TemplateDropdownProps) {
  return (
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
          onClick={onClose}
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
                onClick={() => onTemplateSelect(template)}
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
          onClick={onClose}
          className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
