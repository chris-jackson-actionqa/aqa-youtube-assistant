/**
 * Centralized error and success messages for the application.
 * This file ensures consistency across all components and makes
 * messages easy to maintain and internationalize in the future.
 */

export const ERROR_MESSAGES = {
  // Template operations
  LOAD_TEMPLATES: "Unable to load templates. Please try again.",
  APPLY_TEMPLATE: "Failed to apply template. Please try again.",

  // Project operations
  LOAD_PROJECTS: "Failed to load projects. Please try again.",
  DELETE_PROJECT: "Failed to delete project. Please try again.",
  LOAD_PROJECT: "Failed to load project. Please try again.",
  REFRESH_PROJECT: "Failed to refresh project. Please try again.",

  // Workspace operations
  LOAD_WORKSPACES: "Failed to load workspaces. Please try again.",
  CREATE_WORKSPACE: "Failed to create workspace. Please try again.",
  UPDATE_WORKSPACE: "Failed to update workspace. Please try again.",
  DELETE_WORKSPACE: "Failed to delete workspace. Please try again.",
  REFRESH_WORKSPACES: "Failed to refresh workspaces. Please try again.",
} as const;

export const SUCCESS_MESSAGES = {
  // Project operations
  PROJECT_CREATED: (projectName: string) =>
    `Project "${projectName}" created successfully!`,
} as const;

/**
 * Type for error message keys
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Type for success message keys
 */
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;
