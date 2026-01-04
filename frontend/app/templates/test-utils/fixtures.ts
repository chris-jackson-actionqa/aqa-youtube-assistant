/**
 * Test fixtures for Templates page tests
 * Contains mock data for creating test templates
 */

import { Template } from "@/app/types/template";

/**
 * Standard mock templates for testing
 */
export const mockTemplates: Template[] = [
  {
    id: 1,
    type: "title",
    name: "Standard Title Template",
    content: "How to {topic} in {year}",
    workspace_id: 1,
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-01T10:00:00Z",
  },
  {
    id: 2,
    type: "description",
    name: "Tutorial Description",
    content: "In this video, we cover {topic}. Subscribe for more!",
    workspace_id: 1,
    created_at: "2025-01-02T11:00:00Z",
    updated_at: "2025-01-02T11:00:00Z",
  },
  {
    id: 3,
    type: "title",
    name: "Question Title Template",
    content: "What is {topic}? (Explained)",
    workspace_id: 1,
    created_at: "2025-01-03T12:00:00Z",
    updated_at: "2025-01-03T12:00:00Z",
  },
];
