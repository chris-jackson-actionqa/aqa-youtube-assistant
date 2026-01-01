"use client";

import { useState, FormEvent } from "react";
import { TemplateCreate, TemplateUpdate, Template } from "../types/template";
import { createTemplate, updateTemplate, ApiError } from "../lib/api";
import Spinner from "./Spinner";

interface FormErrors {
  type?: string;
  name?: string;
  content?: string;
  placeholders?: string;
  api?: string;
}

interface TemplateFormProps {
  mode?: "create" | "edit";
  initialTemplate?: Template;
  onSuccess?: (template: Template) => void;
  onCancel?: () => void;
}

// Regex to match placeholders like {{placeholder}}
const PLACEHOLDER_REGEX = /\{\{[^}]+\}\}/g;
const EMPTY_PLACEHOLDER_REGEX = /\{\{\s*\}\}/;

/**
 * TemplateForm - Reusable form component for creating and editing templates
 *
 * Features:
 * - Create or edit mode
 * - Name field (1-100 characters) with character counter
 * - Content field (1-256 characters) with character counter
 * - Placeholder validation (at least one, no empty placeholders)
 * - Help text for placeholder syntax
 * - Real-time validation feedback
 * - Character counters
 * - Save/Cancel buttons
 * - Loading state during save
 * - Error handling with user feedback
 * - Full dark mode support
 * - Accessibility features (labels, ARIA, keyboard navigation)
 *
 * @example
 * // Create mode
 * <TemplateForm mode="create" onSuccess={handleSuccess} onCancel={handleCancel} />
 *
 * @example
 * // Edit mode
 * <TemplateForm mode="edit" initialTemplate={template} onSuccess={handleSuccess} onCancel={handleCancel} />
 */
export default function TemplateForm({
  mode = "create",
  initialTemplate,
  onSuccess,
  onCancel,
}: TemplateFormProps) {
  const [type, setType] = useState(initialTemplate?.type || "title");
  const [name, setName] = useState(initialTemplate?.name || "");
  const [content, setContent] = useState(initialTemplate?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get placeholders from content
  const placeholders = content.match(PLACEHOLDER_REGEX) || [];
  const uniquePlaceholders = Array.from(new Set(placeholders));

  // Validation helpers
  const validateName = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed)
      return "Template name cannot be empty or contain only whitespace";
    if (trimmed.length > 100)
      return "Template name cannot exceed 100 characters";
    return undefined;
  };

  const validateContent = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed)
      return "Template content cannot be empty or contain only whitespace";
    if (trimmed.length > 256)
      return "Template content cannot exceed 256 characters";
    return undefined;
  };

  const validatePlaceholders = (value: string): string | undefined => {
    const matches = value.match(PLACEHOLDER_REGEX) || [];
    if (matches.length === 0) {
      return "Template must contain at least one placeholder (e.g., {{topic}})";
    }
    if (EMPTY_PLACEHOLDER_REGEX.test(value)) {
      return "Empty placeholders {{}} are not allowed";
    }
    return undefined;
  };

  const validateType = (value: string): string | undefined => {
    if (!value.trim()) return "Template type is required";
    return undefined;
  };

  // Validation on change handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (formErrors.name) {
      setFormErrors({ ...formErrors, name: undefined });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (formErrors.content || formErrors.placeholders) {
      setFormErrors({
        ...formErrors,
        content: undefined,
        placeholders: undefined,
      });
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setType(e.target.value);
    if (formErrors.type) {
      setFormErrors({ ...formErrors, type: undefined });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFormErrors({});
    setSuccessMessage(null);

    // Validate all fields
    const newErrors: FormErrors = {};
    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;

    const contentError = validateContent(content);
    if (contentError) newErrors.content = contentError;

    const placeholdersError = validatePlaceholders(content);
    if (placeholdersError) newErrors.placeholders = placeholdersError;

    const typeError = validateType(type);
    if (typeError) newErrors.type = typeError;

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      let result: Template;

      if (mode === "create") {
        const templateData: TemplateCreate = {
          type: type.trim(),
          name: name.trim(),
          content: content.trim(),
        };
        result = await createTemplate(templateData);
        setSuccessMessage(`Template "${result.name}" created successfully!`);
      } else {
        // Edit mode
        if (!initialTemplate?.id) {
          throw new Error("Template ID is required for edit mode");
        }
        const templateData: TemplateUpdate = {
          type: type.trim(),
          name: name.trim(),
          content: content.trim(),
        };
        result = await updateTemplate(initialTemplate.id, templateData);
        setSuccessMessage(`Template "${result.name}" updated successfully!`);
      }

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result);
        }, 1500);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Duplicate content (409 Conflict)
        if (err.status === 409) {
          setFormErrors({
            content:
              "A template with this type and content already exists. Please use different content.",
          });
        } else if (err.status === 422) {
          // Validation error from backend
          setFormErrors({
            api:
              err.message ||
              "Validation failed. Please check your input and try again.",
          });
        } else if (err.status === 404) {
          setFormErrors({
            api: "Template not found. It may have been deleted.",
          });
        } else if (err.status >= 500) {
          // Server errors
          setFormErrors({
            api: "Server error. Please try again later.",
          });
        } else if (err.status === 0) {
          // Network error
          setFormErrors({
            api: "Failed to save template. Please check your connection and try again.",
          });
        } else {
          setFormErrors({
            api: err.message,
          });
        }
      } else {
        setFormErrors({
          api: "Failed to save template. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setType(initialTemplate?.type || "title");
    setName(initialTemplate?.name || "");
    setContent(initialTemplate?.content || "");
    setFormErrors({});
    setSuccessMessage(null);
    onCancel?.();
  };

  const isFormValid =
    name.trim() &&
    content.trim() &&
    validateName(name) === undefined &&
    validateContent(content) === undefined &&
    validatePlaceholders(content) === undefined &&
    validateType(type) === undefined;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-2">
        {mode === "create" ? "Create New Template" : "Edit Template"}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Use placeholders like{" "}
        <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
          {`{{topic}}`}
        </code>{" "}
        to create dynamic templates.
      </p>

      {formErrors.api && (
        <div
          role="alert"
          className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            {formErrors.api}
          </p>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p className="text-green-600 dark:text-green-400 text-sm font-medium">
            {successMessage}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Field */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-2">
            Template Type <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="type"
            value={type}
            onChange={handleTypeChange}
            required
            maxLength={50}
            placeholder="e.g., title, description, tags"
            className={`w-full px-4 py-2 border rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500 ${
                       formErrors.type
                         ? "border-red-500 dark:border-red-500"
                         : "border-gray-300 dark:border-gray-600"
                     }`}
            disabled={isSubmitting}
            aria-invalid={!!formErrors.type}
            aria-describedby={formErrors.type ? "type-error" : undefined}
          />
          {formErrors.type && (
            <p
              id="type-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {formErrors.type}
            </p>
          )}
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            required
            maxLength={100}
            placeholder="Enter template name"
            className={`w-full px-4 py-2 border rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500 ${
                       formErrors.name
                         ? "border-red-500 dark:border-red-500"
                         : "border-gray-300 dark:border-gray-600"
                     }`}
            disabled={isSubmitting}
            aria-invalid={!!formErrors.name}
            aria-describedby={formErrors.name ? "name-error" : undefined}
          />
          {formErrors.name && (
            <p
              id="name-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {formErrors.name}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {name.length} / 100 characters
          </p>
        </div>

        {/* Content Field */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Template Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            required
            maxLength={256}
            rows={4}
            placeholder="Enter template content with at least one placeholder"
            className={`w-full px-4 py-2 border rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm ${
                       formErrors.content || formErrors.placeholders
                         ? "border-red-500 dark:border-red-500"
                         : "border-gray-300 dark:border-gray-600"
                     }`}
            disabled={isSubmitting}
            aria-invalid={!!(formErrors.content || formErrors.placeholders)}
            aria-describedby={
              formErrors.content || formErrors.placeholders
                ? "content-error"
                : "content-help"
            }
          />
          {(formErrors.content || formErrors.placeholders) && (
            <p
              id="content-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {formErrors.content || formErrors.placeholders}
            </p>
          )}
          <div className="mt-2 flex flex-col gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {content.length} / 256 characters
            </p>
            {uniquePlaceholders.length > 0 && (
              <p
                id="content-help"
                className="text-xs text-gray-600 dark:text-gray-300"
              >
                Placeholders found:{" "}
                <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                  {uniquePlaceholders.join(", ")}
                </code>
              </p>
            )}
            {uniquePlaceholders.length === 0 && !formErrors.placeholders && (
              <p
                id="content-help"
                className="text-xs text-blue-600 dark:text-blue-400"
              >
                Add placeholders like{" "}
                <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                  {`{{placeholder_name}}`}
                </code>{" "}
                to your content
              </p>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
            Placeholder Syntax:
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>
              Use double curly braces:{" "}
              <code className="bg-white dark:bg-gray-800 px-1 rounded">
                {`{{name}}`}
              </code>
            </li>
            <li>
              Placeholder names can contain letters, numbers, underscores, and
              hyphens
            </li>
            <li>Each template must have at least one placeholder</li>
            <li>Empty placeholders {`{{}}`} are not allowed</li>
            <li>
              Example:{" "}
              <code className="bg-white dark:bg-gray-800 px-1 rounded">
                {`Best {{tools}} for {{topic}}`}
              </code>
            </li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                     disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center justify-center gap-2"
            aria-busy={isSubmitting}
          >
            {isSubmitting && (
              <Spinner
                size={20}
                color="text-white"
                label={
                  mode === "create" ? "Creating template" : "Updating template"
                }
              />
            )}
            <span>
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Updating..."
                : mode === "create"
                  ? "Create Template"
                  : "Update Template"}
            </span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 
                       text-gray-800 dark:text-gray-200 font-medium rounded-lg
                       disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
