import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject } from "@/app/lib/api";
import { Project } from "@/app/types/project";

/**
 * ProjectDetailPage Component
 *
 * Server component that displays project details for a specific project ID.
 * Fetches project data on the server and renders 404 page if project doesn't exist.
 *
 * Features:
 * - Server-side data fetching using Next.js 15 App Router
 * - Automatic 404 handling via notFound()
 * - Direct URL access support (deep linking)
 * - Page refresh persistence
 * - Semantic HTML and accessibility
 *
 * @param params - Route parameters containing project ID
 *
 * @example
 * // Automatically rendered by Next.js for route /projects/[id]
 * // URL: /projects/1 -> Displays project with ID 1
 * // URL: /projects/99999 -> Shows 404 page
 */
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // In Next.js 15, params is a Promise
  const { id } = await params;

  // Validate ID is a positive integer
  // Check both that it's a valid number and matches the original string
  // to prevent accepting values like "12.5", "12abc", etc.
  const projectId = parseInt(id, 10);
  if (isNaN(projectId) || projectId <= 0 || id !== projectId.toString()) {
    notFound();
  }

  // Fetch project data
  let project: Project;
  try {
    project = await getProject(projectId);
  } catch {
    // If project doesn't exist (404), trigger not-found.tsx
    notFound();
  }

  return (
    <main className="container mx-auto max-w-4xl p-6">
      {/* Back Navigation */}
      <Link
        href="/projects"
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
