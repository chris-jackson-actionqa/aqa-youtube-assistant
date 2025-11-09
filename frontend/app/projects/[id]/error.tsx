"use client";

/**
 * Error Boundary for Project Detail Page
 *
 * Catches and handles runtime errors that occur during rendering or data fetching.
 * Provides a user-friendly error message and retry functionality.
 *
 * This component is automatically invoked by Next.js when an error occurs
 * in the page.tsx Server Component or its children.
 *
 * Features:
 * - User-friendly error display
 * - Retry functionality via reset()
 * - Error details in development mode
 * - Accessible error messaging
 * - Consistent with app design system
 *
 * @param error - Error object containing error details
 * @param reset - Function to retry rendering the page
 *
 * @example
 * // Automatically rendered by Next.js when page.tsx throws an error
 * // No manual invocation needed
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <div
        role="alert"
        aria-live="assertive"
        className="rounded-lg border border-red-200 bg-red-50 p-8 shadow-sm"
      >
        {/* Error icon and title */}
        <div className="mb-4 flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100"
            aria-hidden="true"
          >
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="mb-2 text-2xl font-bold text-red-900">
              Something went wrong
            </h1>
            <p className="text-red-800">
              We encountered an error while loading the project details.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error.message && (
          <div className="mb-6 rounded-md bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              Error Details:
            </h2>
            <p className="text-sm text-gray-700">{error.message}</p>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="
              rounded-lg bg-red-600 px-6 py-3 font-medium text-white
              transition-colors duration-200
              hover:bg-red-700
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            "
          >
            Try Again
          </button>
          <a
            href="/projects"
            className="
              rounded-lg border border-red-300 bg-white px-6 py-3 font-medium text-red-700
              transition-colors duration-200
              hover:bg-red-50
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            "
          >
            Back to Projects
          </a>
        </div>

        {/* Help text */}
        <div className="mt-6 border-t border-red-200 pt-4">
          <p className="text-sm text-red-800">
            If the problem persists, please check that:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-800">
            <li>The backend server is running</li>
            <li>You have an active internet connection</li>
            <li>The project ID in the URL is correct</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
