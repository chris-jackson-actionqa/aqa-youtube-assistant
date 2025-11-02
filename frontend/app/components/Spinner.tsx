interface SpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** Color of the spinner (Tailwind color class) */
  color?: string;
  /** Screen reader text describing the loading state */
  label?: string;
}

/**
 * Spinner - Accessible loading spinner component
 * 
 * Displays an animated spinner to indicate loading state.
 * Includes proper ARIA attributes for screen reader accessibility.
 * 
 * @example
 * <Spinner size={20} color="text-white" label="Creating project" />
 */
export default function Spinner({
  size = 20,
  color = "text-white",
  label = "Loading",
}: SpinnerProps) {
  return (
    <div className="inline-flex items-center" role="status" aria-live="polite">
      <svg
        className={`animate-spin ${color}`}
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
