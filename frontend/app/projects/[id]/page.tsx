"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProject, updateProject } from "@/app/lib/api";
import { Project } from "@/app/types/project";
import { VideoTitleEditor } from "@/app/components/VideoTitleEditor";
import { TemplateSelector } from "@/app/components/TemplateSelector";

/**
 * ProjectDetailPage Component
 *
 * Client component that displays project details for a specific project ID.
 * Fetches project data on the client side with workspace context support.
 *
 * Features:
 * - Client-side data fetching with workspace isolation support
 * - Automatic 404 handling
 * - Direct URL access support (deep linking)
 * - Page refresh persistence
 * - Semantic HTML and accessibility
 * - Loading states
 *
 * @example
 * // Automatically rendered by Next.js for route /projects/[id]
 * // URL: /projects/1 -> Displays project with ID 1
 * // URL: /projects/99999 -> Shows 404 page
 */
export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  // Memoized handler for updating project video title to avoid duplication
  // Used by both VideoTitleEditor and TemplateSelector
  const handleTitleUpdate = useCallback(
    async (newTitle: string | null) => {
      await updateProject(project!.id, { video_title: newTitle });
      setProject((prev) => (prev ? { ...prev, video_title: newTitle } : null));
    },
    [project?.id]
  );

  useEffect(() => {
    // Validate ID is a positive integer
    const projectId = parseInt(id, 10);
    if (isNaN(projectId) || projectId <= 0 || id !== projectId.toString()) {
      // Invalid ID format - show 404 without redirecting
      setError("not-found");
      setIsLoading(false);
      return;
    }

    // Fetch project data
    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getProject(projectId);
        setProject(data);
      } catch {
        // If project doesn't exist (404), show 404 page
        setError("not-found");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
        <main className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600 dark:text-gray-400">
              Loading project details...
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show 404 if project not found
  if (error === "not-found" || !project) {
    return (
      <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
        <main className="max-w-6xl mx-auto">
          <div
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-8"
          >
            <h1 className="mb-2 text-2xl font-bold text-red-900 dark:text-red-200">
              404
            </h1>
            <h2 className="mb-4 text-xl font-semibold text-red-800 dark:text-red-300">
              Project Not Found
            </h2>
            <p className="mb-6 text-red-700 dark:text-red-400">
              The project you&apos;re looking for doesn&apos;t exist or may have
              been deleted.
            </p>
            <Link
              href="/"
              className="inline-flex items-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline"
            >
              <span aria-hidden="true">← </span>
              Back to Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors duration-200"
          aria-label="Back to projects list"
        >
          <span aria-hidden="true">← </span>
          Back to Projects
        </Link>

        {/* Project Title */}
        <header className="mb-6">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {project.name}
          </h1>

          {/* Metadata - Created and Updated dates */}
          <div className="text-gray-600 dark:text-gray-400 space-y-1">
            <p className="text-sm">
              <span className="font-medium">Created:</span>{" "}
              {formatDate(project.created_at)}
            </p>
            <p className="text-sm">
              <span className="font-medium">Updated:</span>{" "}
              {formatDate(project.updated_at)}
            </p>
          </div>
        </header>

        {/* Project Description */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Description
          </h2>
          {project.description !== null && project.description.trim() !== "" ? (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {project.description}
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No description provided
            </p>
          )}
        </section>

        {/* Video Title Section */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Video Title
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-3">
            <VideoTitleEditor
              initialTitle={project.video_title}
              onSave={handleTitleUpdate}
            />
            <TemplateSelector
              currentTitle={project.video_title}
              onApply={handleTitleUpdate}
            />
          </div>
        </section>
      </main>
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
    hour: "2-digit",
    minute: "2-digit",
  });
}
