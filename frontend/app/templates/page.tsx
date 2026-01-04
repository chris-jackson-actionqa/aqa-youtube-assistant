"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deleteTemplate, getTemplates } from "@/app/lib/api";
import TemplateFormModal from "@/app/components/TemplateFormModal";
import TemplateDeleteModal from "@/app/components/TemplateDeleteModal";
import FilterButton from "@/app/components/FilterButton";
import Button from "@/app/components/Button";
import {
  formatTemplateTypeLabel,
  NormalizedTemplate,
  Template,
  TemplateType,
} from "@/app/types/template";
import {
  normalizeTemplateFromApi,
  calculateTemplateCounts,
  filterTemplatesByType,
  formatDate,
} from "@/app/utils/template";

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
  const [templates, setTemplates] = useState<NormalizedTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TemplateType | "all">("all");

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Edit form state
  const [editingTemplate, setEditingTemplate] =
    useState<NormalizedTemplate | null>(null);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<NormalizedTemplate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getTemplates();
        const normalized = data.map(normalizeTemplateFromApi);
        setTemplates(normalized);
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

  const templateCounts = useMemo(
    () => calculateTemplateCounts(templates),
    [templates]
  );

  const filteredTemplates = useMemo(
    () => filterTemplatesByType(templates, selectedType),
    [selectedType, templates]
  );

  const selectedTypeLabel = useMemo(
    () =>
      selectedType === "all" ? "All" : formatTemplateTypeLabel(selectedType),
    [selectedType]
  );

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedTemplate(null);
    setDeleteError(null);
  }, []);

  const closeCreateForm = useCallback(() => {
    setShowCreateForm(false);
  }, []);

  const closeEditForm = useCallback(() => {
    setEditingTemplate(null);
  }, []);

  const handleDeleteClick = (template: NormalizedTemplate) => {
    setSelectedTemplate(template);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSuccess = (newTemplate: Template) => {
    const normalized = normalizeTemplateFromApi(newTemplate);
    setTemplates((currentTemplates) => [normalized, ...currentTemplates]);
    closeCreateForm();
  };

  const handleEditClick = (template: NormalizedTemplate) => {
    setEditingTemplate(template);
  };

  const handleEditSuccess = (updatedTemplate: Template) => {
    const normalized = normalizeTemplateFromApi(updatedTemplate);
    setTemplates((currentTemplates) =>
      currentTemplates.map((t) => (t.id === normalized.id ? normalized : t))
    );
    closeEditForm();
  };

  const handleDeleteConfirm = async () => {
    // selectedTemplate is always non-null here because the delete modal only renders when it's set
    const templateId = selectedTemplate!.id;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteTemplate(templateId);

      setTemplates((currentTemplates) =>
        currentTemplates.filter((template) => template.id !== templateId)
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
            <Button variant="danger" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
      <main
        className="max-w-6xl mx-auto"
        aria-hidden={isDeleteDialogOpen || showCreateForm || !!editingTemplate}
      >
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              Templates
            </h1>
            <Button
              onClick={() => setShowCreateForm(true)}
              aria-label="Create new template"
            >
              Create Template
            </Button>
          </div>
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
            {[
              { type: "all" as const, label: "All", count: templateCounts.all },
              {
                type: "title" as const,
                label: "Title",
                count: templateCounts.title,
              },
              {
                type: "description" as const,
                label: "Description",
                count: templateCounts.description,
              },
            ].map((filter, index) => (
              <FilterButton
                key={filter.type}
                label={filter.label}
                count={filter.count}
                isActive={selectedType === filter.type}
                onClick={() => setSelectedType(filter.type)}
                position={
                  index === 0 ? "first" : index === 2 ? "last" : "middle"
                }
              />
            ))}
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
                {selectedType === "all"
                  ? "No templates found. Create your first template to get started."
                  : `No ${selectedTypeLabel} templates found.`}
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
                          template.type === "title"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}
                      >
                        {formatTemplateTypeLabel(template.type)}
                      </span>
                    </div>

                    <div className="ml-4 flex gap-2">
                      <Button
                        type="button"
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEditClick(template)}
                        aria-label={`Edit template ${template.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(template)}
                        aria-label={`Delete template ${template.name}`}
                      >
                        Delete
                      </Button>
                    </div>
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

      {/* Template Modals */}
      <TemplateFormModal
        isOpen={showCreateForm}
        mode="create"
        onSuccess={handleCreateSuccess}
        onClose={closeCreateForm}
      />

      <TemplateFormModal
        isOpen={!!editingTemplate}
        mode="edit"
        initialTemplate={editingTemplate || undefined}
        onSuccess={handleEditSuccess}
        onClose={closeEditForm}
      />

      <TemplateDeleteModal
        isOpen={isDeleteDialogOpen}
        template={selectedTemplate}
        error={deleteError}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={closeDeleteDialog}
      />
    </div>
  );
}
