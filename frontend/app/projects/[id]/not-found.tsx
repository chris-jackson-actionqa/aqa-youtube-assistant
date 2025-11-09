import Link from "next/link";

/**
 * NotFound Component
 *
 * Displays a 404 error page when a project is not found.
 * Triggered by Next.js notFound() function in page.tsx.
 *
 * Features:
 * - Clear error messaging
 * - Link back to projects list
 * - Accessible with semantic HTML and ARIA attributes
 * - Responsive design with Tailwind CSS
 *
 * @example
 * // Triggered automatically by Next.js when notFound() is called
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div
        className="max-w-md text-center"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <h1 className="mb-4 text-6xl font-bold text-gray-800">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-700">
          Project Not Found
        </h2>
        <p className="mb-8 text-gray-600">
          The project you&apos;re looking for doesn&apos;t exist or may have
          been deleted.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Navigate back to projects list"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Projects
        </Link>
      </div>
    </main>
  );
}
