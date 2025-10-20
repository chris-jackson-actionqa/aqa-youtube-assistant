# Frontend Components Documentation

## Overview

This document describes the frontend components for the YouTube Assistant project.

## Components

### ProjectForm

**Location**: `app/components/ProjectForm.tsx`

A form component for creating new projects. Uses controlled inputs with React state management.

**Props**:
- `onSuccess?: () => void` - Callback function called after successful project creation
- `onCancel?: () => void` - Callback function for cancel button (if provided, cancel button is shown)

**Features**:
- **Title Field** (required): Max 255 characters
- **Description Field** (optional): Multi-line text area
- **Status Field**: Dropdown with predefined statuses (planned, in_progress, completed, archived)
- **Validation**: Client-side validation with required field checking
- **Error Handling**: Displays API errors in a user-friendly format
- **Success Message**: Shows confirmation message after successful creation
- **Loading State**: Disables form during submission
- **Auto-reset**: Clears form after successful submission

**Usage**:
```tsx
<ProjectForm 
  onSuccess={() => {
    console.log('Project created!');
    // Refresh project list, close modal, etc.
  }}
  onCancel={() => {
    console.log('Form cancelled');
  }}
/>
```

**Duplicate Title Handling**:
The backend validates for duplicate titles (case-insensitive). If a duplicate title is submitted, the form will display an error message from the API.

## API Integration

### API Module

**Location**: `app/lib/api.ts`

Centralized API client with error handling and TypeScript types.

**Functions**:
- `createProject(data: ProjectCreate): Promise<Project>` - Create a new project
- `getProjects(): Promise<Project[]>` - Get all projects
- `getProject(id: number): Promise<Project>` - Get a single project
- `updateProject(id: number, data: ProjectUpdate): Promise<Project>` - Update a project
- `deleteProject(id: number): Promise<{message: string}>` - Delete a project
- `checkHealth(): Promise<{status: string}>` - Check API health

**Error Handling**:
All API functions throw `ApiError` with:
- `message`: Human-readable error message
- `status`: HTTP status code (0 for network errors)
- `details`: Raw error response from API

**Configuration**:
API base URL can be configured via environment variable:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Type Definitions

**Location**: `app/types/project.ts`

TypeScript interfaces matching the backend Pydantic schemas:

```typescript
interface Project {
  id: number;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ProjectCreate {
  title: string;
  description?: string | null;
  status?: string;
}

interface ProjectUpdate {
  title?: string;
  description?: string | null;
  status?: string;
}

type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'archived';
```

## Styling

All components use **Tailwind CSS** for styling with:
- Responsive design patterns
- Dark mode support (via `dark:` prefixes)
- Consistent color scheme
- Accessible form controls
- Smooth transitions and hover effects

## Best Practices

1. **Error Messages**: Always display user-friendly error messages
2. **Loading States**: Show loading indicators during async operations
3. **Validation**: Validate on both client and server
4. **Accessibility**: Use semantic HTML and proper labels
5. **Type Safety**: Use TypeScript interfaces for all props and state
6. **API Calls**: Use the centralized API module, never fetch directly

## Future Enhancements

- [ ] Edit project functionality
- [ ] Delete project with confirmation
- [ ] Bulk operations (select multiple projects)
- [ ] Project search and filtering
- [ ] Sorting by different fields
- [ ] Pagination for large project lists
- [ ] Project detail view
- [ ] Status change workflow
