interface FilterButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  position?: "first" | "middle" | "last";
}

/**
 * FilterButton Component
 *
 * A reusable button for filtering lists with visual active state and count badge.
 * Designed to be used in a button group with consistent styling.
 *
 * Features:
 * - Active/inactive visual states
 * - Count badge display
 * - Accessibility (aria-pressed state)
 * - Dark mode support
 * - Keyboard navigation support
 * - Position-aware styling for button groups
 *
 * @example
 * ```tsx
 * <FilterButton
 *   label="All"
 *   count={10}
 *   isActive={selectedType === "all"}
 *   onClick={() => setSelectedType("all")}
 *   position="first"
 * />
 * ```
 */
export default function FilterButton({
  label,
  count,
  isActive,
  onClick,
  position = "middle",
}: FilterButtonProps) {
  const baseClasses =
    "px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset";

  const stateClasses = isActive
    ? "bg-blue-600 text-white"
    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700";

  const positionClasses =
    position === "middle" || position === "last"
      ? "border-l border-gray-300 dark:border-gray-600"
      : "";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${stateClasses} ${positionClasses}`}
      aria-pressed={isActive}
    >
      {label} ({count})
    </button>
  );
}
