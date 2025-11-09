"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/app/lib/api";
import { Project } from "@/app/types/project";

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
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

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
  }, [id, router]);

  // Show loading state
  if (isLoading) {
    return (
      <main className="container mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading project details...</div>
        </div>
      </main>
    );
  }

  // Show 404 if project not found
  if (error === "not-found" || !project) {
    return (
      <main className="container mx-auto max-w-4xl p-6">
        <div 
          role="alert" 
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 p-8"
        >
          <h1 className="mb-2 text-2xl font-bold text-red-900">404</h1>
          <h2 className="mb-4 text-xl font-semibold text-red-800">
            Project Not Found
          </h2>
          <p className="mb-6 text-red-700">
            The project you&apos;re looking for doesn&apos;t exist or may have been deleted.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center text-red-600 hover:text-red-800 hover:underline"
          >
            <span aria-hidden="true">← </span>
            Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl p-6">
      {/* Back Navigation */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-colors duration-200"
        aria-label="Back to projects list"
      >
        <span aria-hidden="true">← </span>
        Back to Projects
      </Link>

      <article className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <header className="mb-6 border-b border-gray-200 pb-4">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {project.name}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusStyles(
                project.status
              )}`}
              aria-label={`Project status: ${formatStatus(project.status)}`}
            >
              {formatStatus(project.status)}
            </span>
          </div>
        </header>

        {/* Description */}
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-800">
            Description
          </h2>
          {project.description ? (
            <p className="text-gray-700">{project.description}</p>
          ) : (
            <p className="italic text-gray-500">No description provided</p>
          )}
        </section>

        {/* Metadata */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Details</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-600">Created</dt>
              <dd className="mt-1 text-gray-900">
                {formatDate(project.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">
                Last Updated
              </dt>
              <dd className="mt-1 text-gray-900">
                {formatDate(project.updated_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Project ID</dt>
              <dd className="mt-1 text-gray-900">{project.id}</dd>
            </div>
          </dl>
        </section>
      </article>
    </main>
  );
}

/**
 * Get Tailwind CSS classes for status badge
 */
function getStatusStyles(status: string): string {
  const styles: Record<string, string> = {
    planned: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  };
  return styles[status] || "bg-gray-100 text-gray-800";
}

/**
 * Format status string for display
 */
function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
