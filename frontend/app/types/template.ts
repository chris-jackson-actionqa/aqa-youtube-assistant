/**
 * TypeScript type definitions for Template entities
 * Matches backend Pydantic schemas for Template
 */

/**
 * Template entity returned from API
 */
export interface Template {
  id: number;
  type: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
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
