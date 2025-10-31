/**
 * TypeScript types for Workspace API
 * Matches backend Pydantic schemas for workspaces
 */

export interface Workspace {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface WorkspaceCreate {
  name: string;
  description?: string;
}

export interface WorkspaceUpdate {
  name?: string;
  description?: string;
}
