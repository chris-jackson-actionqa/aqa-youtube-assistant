# Project Management System

## Overview

The YouTube Assistant uses a project-based approach where each project represents the creation of **one YouTube video**. A project is essentially a workspace that organizes all the planning, scripting, production, and publishing work for a single video using standardized processes.

**Core Concept**: One project = One video being created

## Concept: What is a Project?

A **Project** is a workspace for planning and producing **one specific YouTube video**. It contains everything related to creating that video from initial concept through final publication:
- Video concept and ideas
- Script drafts
- Production checklists
- Research notes
- Publishing details
- Analytics tracking

**Key Point**: One project = One video. The project represents the entire lifecycle of creating a YouTube video.

**Architecture**: We use a single `Project` entity that evolves through the video creation process, with fields that populate as the project progresses from planning to publishing.

## Core Operations

### 1. Create Project

**Purpose**: Initialize a new project workspace for a YouTube video production.

**User Flow**:
1. User clicks "New Project" or similar action
2. System presents a form/dialog requesting:
   - **Project Name** (required) - A descriptive identifier (e.g., "Cypress drag and drop", "Cool software testing tools")
   - **Description** (optional) - Additional context about the project
3. User submits the form
4. System validates input and creates the project
5. User is redirected to the new project workspace

**Business Rules**:
- Project name is required and must be non-empty
- Project name should be unique (recommendation, not hard requirement initially)
- Project name can be any valid string (alphanumeric, spaces, special characters allowed)
- Description is optional
- System auto-generates: `id`, `created_at`, `updated_at`

**Technical Notes**:
- Project name is the primary user-facing identifier
- Consider adding a URL-friendly slug for future use
- Timestamps use UTC

### 2. Load Project

**Purpose**: Open an existing project to view or edit its contents.

**User Flow**:
1. User views a list of all available projects
2. User selects a project from the list
3. System loads the project and all related data
4. User can now work within that project context

**Display Options**:
- **List View**: Show all projects with name, description, last updated date
- **Grid/Card View**: Visual representation of projects
- **Recent Projects**: Quick access to recently used projects

**Technical Notes**:
- List should be paginated if user has many projects
- Consider caching recently accessed projects
- Load project metadata first, lazy-load related content as needed

### 3. Delete Project

**Purpose**: Remove a project and all associated data when it's no longer needed.

**User Flow**:
1. User selects "Delete Project" action
2. System displays confirmation dialog:
   - "Are you sure you want to delete '{project_name}'?"
   - "This action cannot be undone."
   - "All project data including scripts and notes will be permanently deleted."
3. User confirms or cancels
4. If confirmed, system deletes the project
5. User receives confirmation message
6. User is redirected to project list or home page

**Business Rules**:
- Deletion requires explicit confirmation
- Deletion is permanent (no soft delete in initial version)
- All related data is removed (project acts as container for all artifacts)
- Cannot delete a project that doesn't exist (error handling)

**Technical Notes**:
- Use database transactions to ensure complete deletion
- Consider implementing soft delete (archive) in future versions
- Log deletion events for audit trail
- Handle foreign key relationships properly

## Data Model

### Project Entity

```python
class Project(Base):
    """
    Represents a YouTube video production project.
    Each project is for creating one specific YouTube video.
    The project evolves through the video creation lifecycle.
    """
    id: int  # Primary key, auto-increment
    name: str  # Project name, user-defined identifier
    description: str | None  # Optional project description/notes
    status: str  # planned, scripting, filming, editing, published
    created_at: datetime  # Timestamp of creation (UTC)
    updated_at: datetime  # Timestamp of last modification (UTC)
    
    # Future fields (added as project progresses):
    # video_title: str | None  # Final published video title
    # video_description: str | None  # Final published description
    # thumbnail_url: str | None
    # published_url: str | None  # YouTube URL
    # published_at: datetime | None
```

### Database Schema

```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Note**: Additional fields will be added as features are implemented (video_title, published_url, etc.)

## API Endpoints

### Create Project
```
POST /api/projects
Content-Type: application/json

Request Body:
{
    "name": "My YouTube Project",
    "description": "Optional description",
    "status": "planned"
}

Response (201 Created):
{
    "id": 1,
    "name": "My YouTube Project",
    "description": "Optional description",
    "status": "planned",
    "created_at": "2025-10-19T12:00:00Z",
    "updated_at": "2025-10-19T12:00:00Z"
}
```

### List Projects
```
GET /api/projects

Response (200 OK):
{
    "projects": [
        {
            "id": 1,
            "name": "My YouTube Project",
            "description": "Optional description",
            "status": "planned",
            "created_at": "2025-10-19T12:00:00Z",
            "updated_at": "2025-10-19T12:00:00Z"
        }
    ]
}
```

### Get Project by ID
```
GET /api/projects/{id}

Response (200 OK):
{
    "id": 1,
    "name": "My YouTube Project",
    "description": "Optional description",
    "status": "planned",
    "created_at": "2025-10-19T12:00:00Z",
    "updated_at": "2025-10-19T12:00:00Z"
}

Response (404 Not Found):
{
    "detail": "Project not found"
}
```

### Update Project
```
PUT /api/projects/{id}
Content-Type: application/json

Request Body:
{
    "name": "Updated Project Name",
    "description": "Updated description",
    "status": "scripting"
}

Response (200 OK):
{
    "id": 1,
    "name": "Updated Project Name",
    "description": "Updated description",
    "status": "scripting",
    "created_at": "2025-10-19T12:00:00Z",
    "updated_at": "2025-10-19T14:30:00Z"
}
```

### Delete Project
```
DELETE /api/projects/{id}

Response (204 No Content)
- Empty body, successful deletion

Response (404 Not Found):
{
    "detail": "Project not found"
}
```

## Frontend Components

### ProjectSelector
- Displays list of available projects
- Allows user to select and load a project
- Shows recent projects for quick access

### ProjectCreateForm
- Modal or page for creating new projects
- Form validation
- Error handling

### ProjectDeleteConfirmation
- Confirmation dialog for destructive action
- Clear messaging about permanence
- Cancel and confirm actions

## Future Enhancements

TBD

## Implementation Notes

### Backend Considerations
1. Create `Project` model in SQLAlchemy
2. Create Pydantic schemas for validation
3. Implement CRUD operations
4. Add proper error handling
5. Consider adding database indexes on `name` and `created_at`

### Frontend Considerations
1. Create project management UI components
2. Implement project selection mechanism
3. Add project context to application state
4. Handle loading states and errors
5. Implement responsive design for mobile

### Testing Considerations
1. Unit tests for API endpoints
2. Integration tests for database operations
3. Frontend component tests
4. E2E tests for complete user flows

---

**Related Issues**: #2  
**Last Updated**: October 19, 2025
