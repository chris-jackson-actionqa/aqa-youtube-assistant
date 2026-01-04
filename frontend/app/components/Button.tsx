import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "outline-danger"
  | "outline-primary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Button Component
 *
 * A reusable button component with consistent styling across the application.
 * Supports multiple variants and sizes with dark mode and accessibility features.
 *
 * Features:
 * - Multiple style variants (primary, secondary, danger, etc.)
 * - Size options (sm, md, lg)
 * - Disabled state handling
 * - Focus ring for accessibility
 * - Dark mode support
 * - Forwards ref for focus management
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Save
 * </Button>
 *
 * <Button variant="danger" size="sm" disabled={isLoading}>
 *   {isLoading ? "Deleting..." : "Delete"}
 * </Button>
 * ```
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-70",
      secondary:
        "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-blue-500",
      danger:
        "bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500 disabled:opacity-70",
      "outline-danger":
        "border border-red-200 dark:border-red-700 bg-white dark:bg-gray-900 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-800/30 focus:ring-red-500",
      "outline-primary":
        "border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800/30 focus:ring-blue-500",
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-4 py-2 text-base",
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button ref={ref} className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
