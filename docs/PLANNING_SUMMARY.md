# Project Management Feature - Planning Summary

**Date**: October 19, 2025  
**Epic**: Issue #2  
**Status**: Planned - Ready for Implementation

## Overview

This document summarizes the planning work completed for the Project Management feature, which enables users to create, load, and delete YouTube video projects.

## What We've Created

### 1. Documentation
- **`/docs/PROJECT_MANAGEMENT.md`** - Comprehensive feature documentation
  - User flows for create, load, delete operations
  - Data model specifications
  - API endpoint specifications
  - Frontend component requirements
  - Future enhancement ideas

- **`/docs/adr/ADR-001-project-based-organization.md`** - Architecture Decision Record
  - Rationale for project-based organization
  - Alternatives considered
  - Consequences and trade-offs
  - Future considerations

### 2. GitHub Issues

**Epic Issue #2**: Project Management - Create, Load, and Delete Projects
- High-level feature description
- User stories and acceptance criteria
- Technical considerations
- Links to all related tasks

**Task Issues**:
- **Issue #3**: Create Project data model (Backend)
  - SQLAlchemy model implementation
  - Pydantic schemas for validation
  - Database table creation
  - **Updated**: Single entity model, no relationships

- **Issue #4**: Implement Project CRUD API endpoints (Backend)
  - Five RESTful endpoints (Create, List, Get, Update, Delete)
  - Error handling and validation
  - Depends on: #3

- **Issue #5**: Create frontend project management UI components (Frontend)
  - ProjectList, ProjectCreateForm, ProjectDeleteConfirmation
  - Integration with API
  - Depends on: #4

- **Issue #6**: ~~Update Video model to link videos to projects~~ **REMOVED**
  - No longer needed with single entity model
  - Will close this issue

- **Issue #7**: Integration testing for project management workflow (Testing)
  - Backend, frontend, and E2E tests
  - **Updated**: No relationship testing needed
  - Depends on: #3, #4, #5

### 3. Implementation Order

```
1. Issue #3: Data Model (Backend) - Single Project entity
   ↓
2. Issue #4: API Endpoints (Backend)
   ↓
3. Issue #5: UI Components (Frontend)
   ↓
4. Issue #7: Integration Testing
   
Issue #6: REMOVED (not needed with single entity)
```

## Key Design Decisions

### 1. Single Entity Model
- Projects are the only entity needed
- Each project **is** a video being created (not a container for a video)
- **Simplified architecture**: No relationships, no foreign keys, no cascade deletes

### 2. Simple CRUD Operations
- Create: Initialize new project workspace
- Load: Select and view existing project
- Delete: Remove project and all contents (with confirmation)

### 3. Lifecycle-Based Model
- Project evolves through stages: planned → scripting → filming → editing → published
- Fields populate as project progresses (e.g., published_url only when published)
- Single entity tracks entire video creation lifecycle

### 4. Required Fields
- **Required**: Project name, status (defaults to "planned")
- **Optional**: Project description
- **Auto-generated**: id, created_at, updated_at
- **Future fields**: video_title, published_url, thumbnail_url, etc.

## Data Model

```
Project (single entity - represents the video being created)
├── id: int (PK)
├── name: str (required - working title/project name)
├── description: str | null (optional - project notes)
├── status: str (required - planned, scripting, filming, editing, published)
├── created_at: datetime
├── updated_at: datetime
└── Future fields as project progresses:
    ├── video_title: str | null (final published title)
    ├── video_description: str | null (final published description)
    ├── thumbnail_url: str | null
    ├── published_url: str | null (YouTube URL)
    └── published_at: datetime | null
```

**Note**: The existing `Video` model in the codebase will be replaced/refactored into this unified `Project` model.

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/projects` | Create new project |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/{id}` | Get specific project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |

## Frontend Components

1. **ProjectList** - Display and select projects
2. **ProjectCreateForm** - Create new projects
3. **ProjectDeleteConfirmation** - Confirm deletion
4. **Project Context** - Manage active project state

## Next Steps

### To Begin Implementation:

1. **Start with Issue #3** (Data Model)
   - Create `Project` model in `backend/app/models.py`
   - Create Pydantic schemas
   - Test database table creation

2. **Move to Issue #4** (API Endpoints)
   - Implement five CRUD endpoints
   - Add error handling
   - Test with Postman or similar

3. **Continue with Issue #6** (Video Relationship)
   - Add `project_id` to Video model
   - Update existing code
   - Handle migration

4. **Build Issue #5** (Frontend UI)
   - Create React components
   - Integrate with API
   - Style with Tailwind

5. **Complete with Issue #7** (Testing)
   - Write comprehensive tests
   - Verify all workflows
   - Document test coverage

## Success Criteria

✅ Users can create a new project with a name  
✅ Users can view a list of all projects  
✅ Users can select and load a project  
✅ Users can update project details and status  
✅ Users can delete a project (with confirmation)  
✅ Project represents the entire video creation lifecycle  
✅ Simple single-entity architecture with no relationships  
✅ All operations have proper error handling  
✅ UI is responsive and user-friendly  
✅ Comprehensive tests cover all workflows

## Questions or Decisions Needed

- [ ] Should project names be unique? (Recommendation: yes, but not enforced initially)
- [ ] Should we implement soft delete (archive)? (No for v1, consider for v2)
- [ ] Pagination for project list? (Not initially, add when needed)
- [ ] Project-level settings/preferences? (Future enhancement)

## Resources

- Epic Issue: https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/2
- Task Issues: #3, #4, #5, #6, #7
- Documentation: `/docs/PROJECT_MANAGEMENT.md`
- ADR: `/docs/adr/ADR-001-project-based-organization.md`

---

**Planning Complete**: Ready to begin implementation  
**Next Action**: Assign and start work on Issue #3 (Data Model)
