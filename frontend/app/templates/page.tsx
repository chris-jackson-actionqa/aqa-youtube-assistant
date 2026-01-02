"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { deleteTemplate, getTemplates } from "@/app/lib/api";
import { Template } from "@/app/types/template";

/**
 * TemplatesPage Component
 *
 * Client component that displays a list of all templates with filtering by type.
 * Fetches template data on the client side with workspace context support.
 *
 * Features:
 * - Client-side data fetching with workspace isolation support
 * - Filter templates by type (Title or Description)
 * - Empty state handling
 * - Loading states
 * - Responsive design with Tailwind CSS
 * - Dark mode support
 * - Accessibility (ARIA labels, semantic HTML, keyboard navigation)
 *
 * Related: Issue #172 - Create Templates Page Route and Navigation
 *
 * @example
 * // Automatically rendered by Next.js for route /templates
 * // URL: /templates -> Displays all templates
 */
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    "All" | "Title" | "Description"
  >("All");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getTemplates();
        setTemplates(data);
        setFilteredTemplates(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load templates"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const filteredByType = useMemo(() => {
    if (selectedType === "All") return templates;
    return templates.filter((template) => template.type === selectedType);
  }, [selectedType, templates]);

  useEffect(() => {
    setFilteredTemplates(filteredByType);
  }, [filteredByType]);

  useEffect(() => {
    if (!isDeleteDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDeleteDialog();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleteDialogOpen]);

  useEffect(() => {
    if (isDeleteDialogOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isDeleteDialogOpen]);

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTemplate(null);
    setDeleteError(null);
  };

  const handleDeleteClick = (template: Template) => {
    setSelectedTemplate(template);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteTemplate(selectedTemplate.id);

      const updatedTemplates = templates.filter(
        (template) => template.id !== selectedTemplate.id
      );

      setTemplates(updatedTemplates);
      setFilteredTemplates(
        selectedType === "All"
          ? updatedTemplates
          : updatedTemplates.filter(
              (template) => template.type === selectedType
            )
      );

      closeDeleteDialog();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to delete template. Please try again.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
        <main className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">
              Loading templates...
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
        <main className="max-w-6xl mx-auto">
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-8"
          >
            <h2 className="mb-2 text-xl font-bold text-red-900 dark:text-red-200">
              Error
            </h2>
            <p className="mb-4 text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg
                       transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto" aria-hidden={isDeleteDialogOpen}>
        {/* Back Navigation */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors duration-200"
          aria-label="Back to home"
        >
          <span aria-hidden="true">← </span>
          Back to Home
        </Link>

        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Templates
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage video title and description templates
          </p>
        </header>

        {/* Filter Controls */}
        <div className="mb-6">
          <label htmlFor="template-type-filter" className="sr-only">
            Filter by template type
          </label>
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setSelectedType("All")}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200
                ${
                  selectedType === "All"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
              aria-pressed={selectedType === "All"}
            >
              All ({templates.length})
            </button>
            <button
              onClick={() => setSelectedType("Title")}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-l border-gray-300 dark:border-gray-600
                ${
                  selectedType === "Title"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
              aria-pressed={selectedType === "Title"}
            >
              Title ({templates.filter((t) => t.type === "Title").length})
            </button>
            <button
              onClick={() => setSelectedType("Description")}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-l border-gray-300 dark:border-gray-600
                ${
                  selectedType === "Description"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
              aria-pressed={selectedType === "Description"}
            >
              Description (
              {templates.filter((t) => t.type === "Description").length})
            </button>
          </div>
        </div>

        {/* Templates List */}
        <section>
          {filteredTemplates.length === 0 ? (
            <div
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center"
              role="status"
            >
              <p className="text-gray-600 dark:text-gray-400">
                {selectedType === "All"
                  ? "No templates found. Create your first template to get started."
                  : `No ${selectedType} templates found.`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <article
                  key={template.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {template.name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          template.type === "Title"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}
                      >
                        {template.type}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteClick(template)}
                      className="ml-4 inline-flex items-center rounded-md border border-red-200 dark:border-red-700 bg-white dark:bg-gray-900 px-3 py-1 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-800/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      aria-label={`Delete template ${template.name}`}
                    >
                      Delete template
                    </button>
                  </div>

                  {/* Template Content */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 mb-3">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-sm">
                      {template.content}
                    </p>
                  </div>

                  {/* Template Metadata */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <time dateTime={template.created_at}>
                      Created: {formatDate(template.created_at)}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {isDeleteDialogOpen && selectedTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete template"
          onClick={closeDeleteDialog}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete template
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete &quot;{selectedTemplate.name}
              &quot;? This action cannot be undone.
            </p>

            {deleteError && (
              <div
                role="alert"
                className="mb-4 rounded border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-800 dark:text-red-200"
              >
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                ref={cancelButtonRef}
                onClick={closeDeleteDialog}
                className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isDeleting ? "Deleting..." : "Delete Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format ISO date string to readable format
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
