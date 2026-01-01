"use client";

import { useState, FormEvent } from "react";
import { TemplateCreate, TemplateUpdate, Template } from "../types/template";
import { createTemplate, updateTemplate } from "../lib/api";
import Spinner from "./Spinner";
import { FormErrors } from "./TemplateForm/types";
import {
  validateForm,
  extractPlaceholders,
  isFormValid,
} from "./TemplateForm/validation";
import { handleApiError } from "./TemplateForm/errorHandler";
import {
  BUTTON_CANCEL_CLASSES,
  BUTTON_SUBMIT_CLASSES,
  getInputClassName,
  LABEL_CLASSES,
  ERROR_TEXT_CLASSES,
  HELP_TEXT_CLASSES,
  INFO_TEXT_CLASSES,
  HINT_TEXT_CLASSES,
  ALERT_ERROR_CLASSES,
  ALERT_SUCCESS_CLASSES,
  ALERT_INFO_CLASSES,
} from "./TemplateForm/styles";
import {
  SUCCESS_MESSAGES,
  VALIDATION_MESSAGES,
} from "./TemplateForm/constants";

interface TemplateFormProps {
  mode?: "create" | "edit";
  initialTemplate?: Template;
  onSuccess?: (template: Template) => void;
  onCancel?: () => void;
}

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

  // Get unique placeholders from content
  const uniquePlaceholders = extractPlaceholders(content);

  // Change handlers that clear relevant field errors
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

  const handleNameBlur = () => {
    setName(name.trim());
  };

  const handleContentBlur = () => {
    setContent(content.trim());
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFormErrors({});
    setSuccessMessage(null);

    // Validate all fields
    const newErrors = validateForm(name, content, type);
    if (Object.values(newErrors).some((error) => error)) {
      setFormErrors(newErrors as FormErrors);
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
        setSuccessMessage(SUCCESS_MESSAGES.CREATE(result.name));
      } else {
        // Edit mode
        if (!initialTemplate?.id) {
          throw new Error(VALIDATION_MESSAGES.TEMPLATE_ID_REQUIRED);
        }
        const templateData: TemplateUpdate = {
          type: type.trim(),
          name: name.trim(),
          content: content.trim(),
        };
        result = await updateTemplate(initialTemplate.id, templateData);
        setSuccessMessage(SUCCESS_MESSAGES.UPDATE(result.name));
      }

      // Call success callback if provided
      if (onSuccess) {
        const timeoutId = setTimeout(() => {
          onSuccess(result);
        }, 1500);
        // Cleanup timeout on unmount
        return () => clearTimeout(timeoutId);
      }
    } catch (err) {
      setFormErrors(handleApiError(err));
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

  const isValid = isFormValid(name, content, type);

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
        <div role="alert" className={ALERT_ERROR_CLASSES}>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            {formErrors.api}
          </p>
        </div>
      )}

      {successMessage && (
        <div role="status" aria-live="polite" className={ALERT_SUCCESS_CLASSES}>
          <p className="text-green-600 dark:text-green-400 text-sm font-medium">
            {successMessage}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Field */}
        <div>
          <label htmlFor="type" className={LABEL_CLASSES}>
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
            className={getInputClassName(!!formErrors.type)}
            disabled={isSubmitting}
            aria-invalid={!!formErrors.type}
            aria-describedby={formErrors.type ? "type-error" : undefined}
          />
          {formErrors.type && (
            <p id="type-error" className={ERROR_TEXT_CLASSES} role="alert">
              {formErrors.type}
            </p>
          )}
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className={LABEL_CLASSES}>
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            required
            maxLength={100}
            placeholder="Enter template name"
            className={getInputClassName(!!formErrors.name)}
            disabled={isSubmitting}
            aria-invalid={!!formErrors.name}
            aria-describedby={formErrors.name ? "name-error" : undefined}
          />
          {formErrors.name && (
            <p id="name-error" className={ERROR_TEXT_CLASSES} role="alert">
              {formErrors.name}
            </p>
          )}
          <p className={HELP_TEXT_CLASSES}>{name.length} / 100 characters</p>
        </div>

        {/* Content Field */}
        <div>
          <label htmlFor="content" className={LABEL_CLASSES}>
            Template Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            onBlur={handleContentBlur}
            required
            maxLength={256}
            rows={4}
            placeholder="Enter template content with at least one placeholder"
            className={getInputClassName(
              !!(formErrors.content || formErrors.placeholders)
            )}
            disabled={isSubmitting}
            aria-invalid={!!(formErrors.content || formErrors.placeholders)}
            aria-describedby={
              formErrors.content || formErrors.placeholders
                ? "content-error"
                : uniquePlaceholders.length > 0
                  ? "content-placeholders"
                  : "content-hint"
            }
          />
          {(formErrors.content || formErrors.placeholders) && (
            <p id="content-error" className={ERROR_TEXT_CLASSES} role="alert">
              {formErrors.content || formErrors.placeholders}
            </p>
          )}
          <div className="mt-2 flex flex-col gap-2">
            <p className={HELP_TEXT_CLASSES}>
              {content.length} / 256 characters
            </p>
            {uniquePlaceholders.length > 0 && (
              <p id="content-placeholders" className={INFO_TEXT_CLASSES}>
                Placeholders found:{" "}
                <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                  {uniquePlaceholders.join(", ")}
                </code>
              </p>
            )}
            {uniquePlaceholders.length === 0 && !formErrors.placeholders && (
              <p id="content-hint" className={HINT_TEXT_CLASSES}>
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
        <div className={ALERT_INFO_CLASSES}>
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
            disabled={isSubmitting || !isValid}
            className={BUTTON_SUBMIT_CLASSES}
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
              className={BUTTON_CANCEL_CLASSES}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
