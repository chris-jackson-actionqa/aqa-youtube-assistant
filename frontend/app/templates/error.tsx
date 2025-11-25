"use client";

import Link from "next/link";

/**
 * TemplatesError Component
 *
 * Next.js special file that provides error handling UI for the templates page.
 * Shown automatically when an error occurs during rendering.
 *
 * Features:
 * - Error message display
 * - Retry functionality
 * - Navigation back to home
 * - Responsive design
 * - Dark mode support
 * - Accessibility (ARIA labels, semantic HTML)
 *
 * Related: Issue #172 - Create Templates Page Route and Navigation
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function TemplatesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto">
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-8"
        >
          <h1 className="mb-2 text-2xl font-bold text-red-900 dark:text-red-200">
            Something went wrong!
          </h1>
          <p className="mb-6 text-red-700 dark:text-red-400">
            {error.message ||
              "An unexpected error occurred while loading templates."}
          </p>
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg
                       transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Retry loading templates"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                       text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                       transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       inline-block"
              aria-label="Go back to home page"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
