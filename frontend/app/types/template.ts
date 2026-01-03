/**
 * TypeScript type definitions for Template entities
 * Matches backend Pydantic schemas for Template
 */

export const TEMPLATE_TYPES = ["title", "description"] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

/**
 * Template entity returned from API
 */
export interface Template {
  id: number;
  type: string;
  name: string;
  content: string;
  workspace_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Normalized template with canonical template type casing
 */
export type NormalizedTemplate = Omit<Template, "type"> & {
  type: TemplateType;
};

/**
 * Normalize template type values from API responses or user input
 */
export function normalizeTemplateType(value: string): TemplateType {
  const normalized = value.trim().toLowerCase();
  return TEMPLATE_TYPES.includes(normalized as TemplateType)
    ? (normalized as TemplateType)
    : "title";
}

/**
 * Format template type for display (Title/Description)
 */
export function formatTemplateTypeLabel(type: string | TemplateType): string {
  const normalized = normalizeTemplateType(type);
  return normalized === "title" ? "Title" : "Description";
}

/**
 * Data required to create a new template
 */
export interface TemplateCreate {
  type: string;
  name: string;
  content: string;
}

/**
 * Data allowed for updating a template (all fields optional)
 */
export interface TemplateUpdate {
  type?: string;
  name?: string;
  content?: string;
}
