/**
 * TypeScript types for Project API
 * Matches backend Pydantic schemas in backend/app/schemas.py
 */

export interface Project {
  id: number;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  title: string;
  description?: string | null;
  status?: string;
}

export interface ProjectUpdate {
  title?: string;
  description?: string | null;
  status?: string;
}

export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'archived';

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];
