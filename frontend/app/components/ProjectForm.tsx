"use client";

import { useState, FormEvent } from "react";
import {
  ProjectCreate,
  PROJECT_STATUSES,
  ProjectStatus,
} from "../types/project";
import { createProject, ApiError } from "../lib/api";
import Spinner from "./Spinner";

interface FormErrors {
  name?: string; // Field-specific errors (validation, duplicate)
  api?: string; // General API errors
}

interface ProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planned");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setFormErrors({});
    setSuccessMessage(null);
    setIsSubmitting(true);

    // Trim and validate name
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormErrors({
        name: "Project name cannot be empty or contain only whitespace",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const projectData: ProjectCreate = {
        name: trimmedName,
        description: description.trim() || null,
        status,
      };

      const newProject = await createProject(projectData);

      setSuccessMessage(`Project "${newProject.name}" created successfully!`);

      // Reset form
      setName("");
      setDescription("");
      setStatus("planned");

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Duplicate name (409 Conflict)
        if (err.status === 409) {
          setFormErrors({
            name: "A project with this name already exists. Please choose a different name.",
          });
        } else if (err.status === 400) {
          // Validation error - try to show a field-specific message if available
          // If the API provides field errors, you could parse them here.
          setFormErrors({
            api:
              err.message ||
              "Invalid input. Please check your data and try again.",
          });
        } else if (err.status >= 500) {
          // Server errors - show generic user-friendly message
          setFormErrors({
            api: "Server error. Please try again later.",
          });
        } else if (err.status === 0) {
          // Network error
          setFormErrors({
            api: "Failed to create project. Please check your connection and try again.",
          });
        } else {
          // Other API errors - show the API message
          setFormErrors({
            api: err.message,
          });
        }
      } else {
        setFormErrors({
          api: "Failed to create project. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    setStatus("planned");
    setFormErrors({});
    setSuccessMessage(null);
    onCancel?.();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    // Clear name error when user starts typing
    if (formErrors.name) {
      setFormErrors({ ...formErrors, name: undefined });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6">Create New Project</h2>

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
          className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p className="text-green-600 dark:text-green-400 text-sm font-medium">
            {successMessage}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={handleNameChange}
            required
            maxLength={255}
            placeholder="Enter project name"
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
            {name.length} / 255 characters
          </p>
        </div>

        {/* Description Field */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Enter project description (optional)"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description.length} / 2000 characters
          </p>
        </div>

        {/* Status Field */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={isSubmitting}
          >
            {PROJECT_STATUSES.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
          </select>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                     disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center justify-center gap-2"
            aria-busy={isSubmitting}
          >
            {isSubmitting && (
              <Spinner size={20} color="text-white" label="Creating project" />
            )}
            <span>{isSubmitting ? "Creating..." : "Create Project"}</span>
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
