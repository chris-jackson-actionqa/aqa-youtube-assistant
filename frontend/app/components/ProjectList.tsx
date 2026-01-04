"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Project } from "../types/project";
import { getProjects, deleteProject, ApiError } from "../lib/api";
import { ERROR_MESSAGES } from "../constants/messages";
import ProjectDeleteConfirmation from "./ProjectDeleteConfirmation";
import { useProject } from "../contexts/ProjectContext";

interface ProjectListProps {
  onProjectSelect?: (project: Project) => void;
  onProjectDelete?: (projectId: number) => void;
  selectedProjectId?: number | null;
}

/**
 * ProjectList - Display all projects in a responsive grid layout
 *
 * Features:
 * - Fetches projects from API on mount
 * - Displays loading, error, and empty states
 * - Shows project cards with all details
 * - Supports project selection and deletion
 * - Fully accessible with ARIA labels and keyboard navigation
 * - Responsive design (3 cols desktop, 2 tablet, 1 mobile)
 *
 * @example
 * <ProjectList
 *   onProjectSelect={handleSelect}
 *   selectedProjectId={selectedId}
 * />
 */
export default function ProjectList({
  onProjectSelect,
  onProjectDelete,
  selectedProjectId,
}: ProjectListProps) {
  const router = useRouter();
  const { selectProject: selectCurrentProject } = useProject();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(ERROR_MESSAGES.LOAD_PROJECTS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setError(null);

    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));

      if (onProjectDelete) {
        onProjectDelete(id);
      }

      // Close modal after successful deletion
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      // Store error in component state for display outside modal
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(ERROR_MESSAGES.DELETE_PROJECT);
      }
      // Re-throw so modal can also display the error
      throw err;
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setProjectToDelete(null);
    setError(null);
  };

  const handleSelect = async (project: Project) => {
    // Set current project in context
    await selectCurrentProject(project.id);

    // Navigate to project detail page
    router.push(`/projects/${project.id}`);

    // Also call the callback if provided (for backwards compatibility)
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, project: Project) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect(project);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      in_progress:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      completed:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return colors[status as keyof typeof colors] || colors.planned;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      planned: "Planned",
      in_progress: "In Progress",
      completed: "Completed",
      archived: "Archived",
    };
    return labels[status as keyof typeof labels] || "Unknown Status";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="space-y-4"
        role="status"
        aria-live="polite"
        aria-label="Loading projects"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
        <p className="sr-only">Loading projects...</p>
      </div>
    );
  }

  // Error state
  if (error && projects.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div
          role="alert"
          className="flex flex-col items-center justify-center space-y-4"
        >
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg
                     transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label="Retry loading projects"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            No projects yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            Create your first project to get started. Projects help you organize
            your work and track progress.
          </p>
        </div>
      </div>
    );
  }

  // Project list
  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </p>
        </div>
      )}

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        role="list"
        aria-label="Projects"
      >
        {projects.map((project) => {
          const isSelected = selectedProjectId === project.id;
          const isDeleting = deletingId === project.id;

          return (
            <div
              key={project.id}
              data-testid="project-card"
              role="button"
              aria-label={`Select project ${project.name}`}
              aria-pressed={isSelected}
              onClick={() => handleSelect(project)}
              onKeyDown={(e) => handleKeyDown(e, project)}
              tabIndex={0}
              className={`
                bg-white dark:bg-gray-800 p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer
                hover:bg-gray-50 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  isSelected
                    ? "border-blue-500 dark:border-blue-400 shadow-lg selected"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }
                ${isDeleting ? "opacity-50 pointer-events-none" : ""}
              `}
            >
              {/* Project header */}
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex-1">
                  {project.name}
                </h3>
                <span
                  data-testid="status-badge"
                  className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(project.status)}`}
                  aria-label={`Status: ${getStatusLabel(project.status)}`}
                >
                  {getStatusLabel(project.status)}
                </span>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {truncateText(project.description, 100)}
                </p>
              )}

              {/* Metadata */}
              <div className="space-y-1 mb-4 text-xs text-gray-500 dark:text-gray-400">
                <p>
                  <span className="font-medium">Created:</span>{" "}
                  <time dateTime={project.created_at}>
                    {formatDate(project.created_at)}
                  </time>
                </p>
                <p>
                  <span className="font-medium">Updated:</span>{" "}
                  <time dateTime={project.updated_at}>
                    {formatDate(project.updated_at)}
                  </time>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteModal(project);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg
                           transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Delete project ${project.name}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <ProjectDeleteConfirmation
        project={projectToDelete}
        isOpen={deleteModalOpen}
        onConfirm={async (projectId: number) => {
          await handleDelete(projectId);
        }}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}
