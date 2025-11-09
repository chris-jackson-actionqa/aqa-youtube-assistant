/**
 * Loading Component for Project Detail Page
 *
 * Displays a skeleton loading state while the project data is being fetched.
 * Uses Tailwind CSS pulse animation for a smooth loading experience.
 *
 * This component is automatically shown by Next.js when the page.tsx
 * Server Component is streaming data.
 *
 * Features:
 * - Matches the layout of the actual project detail page
 * - Accessible loading indication with aria-live
 * - Smooth skeleton animations
 * - Responsive design
 *
 * @example
 * // Automatically rendered by Next.js during page load
 * // No manual invocation needed
 */
export default function Loading() {
  return (
    <main className="container mx-auto max-w-4xl p-6">
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading project details"
        className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
      >
        {/* Header skeleton */}
        <header className="mb-6 border-b border-gray-200 pb-4">
          {/* Title skeleton */}
          <div className="mb-2 h-9 w-3/4 animate-pulse rounded bg-gray-200" />
          {/* Status badge skeleton */}
          <div className="h-7 w-24 animate-pulse rounded-full bg-gray-200" />
        </header>

        {/* Description section skeleton */}
        <section className="mb-6">
          {/* Section heading skeleton */}
          <div className="mb-3 h-7 w-32 animate-pulse rounded bg-gray-200" />
          {/* Description text skeleton - 3 lines */}
          <div className="space-y-2">
            <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
          </div>
        </section>

        {/* Metadata section skeleton */}
        <section>
          {/* Section heading skeleton */}
          <div className="mb-3 h-7 w-24 animate-pulse rounded bg-gray-200" />
          {/* Metadata grid skeleton */}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Created date skeleton */}
            <div>
              <div className="mb-1 h-5 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            </div>
            {/* Updated date skeleton */}
            <div>
              <div className="mb-1 h-5 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            </div>
            {/* Project ID skeleton */}
            <div>
              <div className="mb-1 h-5 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          </dl>
        </section>

        {/* Screen reader text */}
        <span className="sr-only">Loading project details, please wait...</span>
      </div>
    </main>
  );
}
