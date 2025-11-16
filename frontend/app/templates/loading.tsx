/**
 * TemplatesLoading Component
 *
 * Next.js special file that provides a loading UI while the templates page is loading.
 * Shown automatically during React Suspense boundaries.
 *
 * Features:
 * - Skeleton loading state with pulse animation
 * - Matches the layout of the actual templates page
 * - Responsive design
 * - Dark mode support
 *
 * Related: Issue #172 - Create Templates Page Route and Navigation
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function TemplatesLoading() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto">
        {/* Back link skeleton */}
        <div className="mb-6 h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

        {/* Header skeleton */}
        <header className="mb-8">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
          <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </header>

        {/* Filter controls skeleton */}
        <div className="mb-6">
          <div className="h-10 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* Templates list skeleton */}
        <section className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
            >
              {/* Template header skeleton */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>

              {/* Content skeleton */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 mb-3">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
                </div>
              </div>

              {/* Metadata skeleton */}
              <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
