// Tailwind CSS class constants for form styling
export const INPUT_BASE_CLASSES =
  "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

export const INPUT_ERROR_CLASS = "border-red-500 dark:border-red-500";
export const INPUT_NORMAL_CLASS = "border-gray-300 dark:border-gray-600";

export const getInputClassName = (isError: boolean): string =>
  `${INPUT_BASE_CLASSES} ${isError ? INPUT_ERROR_CLASS : INPUT_NORMAL_CLASS}`;

export const LABEL_CLASSES = "block text-sm font-medium mb-2";
export const ERROR_TEXT_CLASSES = "mt-1 text-sm text-red-600 dark:text-red-400";
export const HELP_TEXT_CLASSES = "text-xs text-gray-500 dark:text-gray-400";
export const INFO_TEXT_CLASSES = "text-xs text-gray-600 dark:text-gray-300";
export const HINT_TEXT_CLASSES = "text-xs text-blue-600 dark:text-blue-400";

export const BUTTON_SUBMIT_CLASSES =
  "flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2";

export const BUTTON_CANCEL_CLASSES =
  "px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-medium rounded-lg disabled:cursor-not-allowed transition-colors duration-200";

export const ALERT_ERROR_CLASSES =
  "mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg";

export const ALERT_SUCCESS_CLASSES =
  "mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg";

export const ALERT_INFO_CLASSES =
  "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4";
