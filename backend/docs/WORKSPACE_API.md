# Workspace API Documentation

This document describes the Workspace CRUD API endpoints and workspace filtering for project endpoints.

**Related**: Issue #92 - Multi-Workspace Support

## Overview

Workspaces provide isolation and organization for projects. Each workspace can contain multiple projects. The default workspace (id=1) is created automatically and cannot be deleted or renamed.

## Base URL

```
http://localhost:8000/api
```

## Workspace Endpoints

### POST /workspaces

Create a new workspace.

**Request Body:**
```json
{
  "name": "string (required, 1-100 chars)",
  "description": "string (optional, max 500 chars)"
}
```

**Validation:**
- Name is trimmed of leading/trailing whitespace
- Empty descriptions are converted to null
- Workspace names must be unique

**Response:** `201 Created`
```json
{
  "id": 2,
  "name": "My Workspace",
  "description": "A workspace for video projects",
  "created_at": "2025-10-30T12:00:00Z",
  "updated_at": "2025-10-30T12:00:00Z",
  "project_count": 0
}
```

**Error Responses:**
- `400 Bad Request` - Duplicate workspace name
- `422 Unprocessable Entity` - Validation error (empty name, too long, etc.)

---

### GET /workspaces

List all workspaces, ordered by creation date (newest first).

Each workspace includes a count of associated projects.

**Response:** `200 OK`
```json
[
  {
    "id": 2,
    "name": "My Workspace",
    "description": "A workspace for video projects",
    "created_at": "2025-10-30T12:00:00Z",
    "updated_at": "2025-10-30T12:00:00Z",
    "project_count": 5
  },
  {
    "id": 1,
    "name": "Default Workspace",
    "description": "Default workspace for testing",
    "created_at": "2025-10-29T10:00:00Z",
    "updated_at": "2025-10-29T10:00:00Z",
    "project_count": 3
  }
]
```

---

### GET /workspaces/{id}

Get a specific workspace by ID.

Includes count of associated projects.

**Path Parameters:**
- `id` (integer, required) - Workspace ID

**Response:** `200 OK`
```json
{
  "id": 2,
  "name": "My Workspace",
  "description": "A workspace for video projects",
  "created_at": "2025-10-30T12:00:00Z",
  "updated_at": "2025-10-30T12:00:00Z",
  "project_count": 5
}
```

**Error Responses:**
- `404 Not Found` - Workspace doesn't exist

---

### PUT /workspaces/{id}

Update an existing workspace.

**Path Parameters:**
- `id` (integer, required) - Workspace ID

**Request Body:**
```json
{
  "name": "string (optional, 1-100 chars)",
  "description": "string (optional, max 500 chars)"
}
```

**Business Rules:**
- Default workspace (id=1) cannot be renamed
- Name is trimmed of leading/trailing whitespace
- Empty descriptions are converted to null
- Workspace names must be unique

**Response:** `200 OK`
```json
{
  "id": 2,
  "name": "Updated Workspace Name",
  "description": "Updated description",
  "created_at": "2025-10-30T12:00:00Z",
  "updated_at": "2025-10-30T14:30:00Z",
  "project_count": 5
}
```

**Error Responses:**
- `404 Not Found` - Workspace doesn't exist
- `403 Forbidden` - Attempting to rename default workspace (id=1)
- `400 Bad Request` - Duplicate workspace name
- `422 Unprocessable Entity` - Validation error

---

### DELETE /workspaces/{id}

Delete a workspace.

**Path Parameters:**
- `id` (integer, required) - Workspace ID

**Business Rules:**
- Default workspace (id=1) cannot be deleted
- Workspaces with existing projects cannot be deleted
- Empty workspaces can be deleted freely

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Workspace doesn't exist
- `403 Forbidden` - Attempting to delete default workspace (id=1)
- `400 Bad Request` - Workspace has projects (must move or delete projects first)

---

## Project Endpoints with Workspace Filtering

All project endpoints now support workspace filtering via the `X-Workspace-Id` header.

### Header Usage

**X-Workspace-Id** (optional, integer)
- Specifies which workspace to operate on
- Defaults to `1` (default workspace) if not provided
- Enables workspace isolation for projects

**Examples:**
```bash
# Use default workspace
curl http://localhost:8000/api/projects

# Use specific workspace
curl -H "X-Workspace-Id: 2" http://localhost:8000/api/projects
```

---

### POST /projects

Create a new project in a specific workspace.

**Headers:**
- `X-Workspace-Id` (optional, integer, default: 1)

**Request Body:**
```json
{
  "name": "string (required, 1-255 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "string (optional, default: 'planned')"
}
```

**Response:** `201 Created`
```json
{
  "id": 10,
  "name": "My Video Project",
  "description": "A great video idea",
  "status": "planned",
  "workspace_id": 2,
  "created_at": "2025-10-30T12:00:00Z",
  "updated_at": "2025-10-30T12:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Workspace doesn't exist
- `409 Conflict` - Duplicate project name (case-insensitive)
- `422 Unprocessable Entity` - Validation error

---

### GET /projects

List projects in a specific workspace.

Projects are ordered by creation date (newest first).

**Headers:**
- `X-Workspace-Id` (optional, integer, default: 1)

**Response:** `200 OK`
```json
[
  {
    "id": 10,
    "name": "My Video Project",
    "description": "A great video idea",
    "status": "planned",
    "workspace_id": 2,
    "created_at": "2025-10-30T12:00:00Z",
    "updated_at": "2025-10-30T12:00:00Z"
  },
  {
    "id": 9,
    "name": "Another Project",
    "description": "Another video idea",
    "status": "in_progress",
    "workspace_id": 2,
    "created_at": "2025-10-29T10:00:00Z",
    "updated_at": "2025-10-30T11:00:00Z"
  }
]
```

---

### GET /projects/{id}

Get a specific project by ID.

**Cross-Workspace Access:** Returns `404` if project exists but belongs to a different workspace.

**Path Parameters:**
- `id` (integer, required) - Project ID

**Headers:**
- `X-Workspace-Id` (optional, integer, default: 1)

**Response:** `200 OK`
```json
{
  "id": 10,
  "name": "My Video Project",
  "description": "A great video idea",
  "status": "planned",
  "workspace_id": 2,
  "created_at": "2025-10-30T12:00:00Z",
  "updated_at": "2025-10-30T12:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Project doesn't exist OR belongs to different workspace

---

### PUT /projects/{id}

Update an existing project.

**Cross-Workspace Access:** Returns `404` if project exists but belongs to a different workspace.

**Path Parameters:**
- `id` (integer, required) - Project ID

**Headers:**
- `X-Workspace-Id` (optional, integer, default: 1)

**Request Body:**
```json
{
  "name": "string (optional, 1-255 chars)",
  "description": "string (optional, max 2000 chars)",
  "status": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": 10,
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "in_progress",
  "workspace_id": 2,
  "created_at": "2025-10-30T12:00:00Z",
  "updated_at": "2025-10-30T14:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Project doesn't exist OR belongs to different workspace
- `409 Conflict` - Duplicate project name (case-insensitive)
- `422 Unprocessable Entity` - Validation error

---

### DELETE /projects/{id}

Delete a project.

**Cross-Workspace Access:** Returns `404` if project exists but belongs to a different workspace.

**Path Parameters:**
- `id` (integer, required) - Project ID

**Headers:**
- `X-Workspace-Id` (optional, integer, default: 1)

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Project doesn't exist OR belongs to different workspace

---

## Workspace Isolation

Projects are isolated by workspace:

1. **Creating projects**: Projects are created in the workspace specified by `X-Workspace-Id`
2. **Listing projects**: Only projects in the specified workspace are returned
3. **Accessing projects**: Cross-workspace access returns `404` (not `403`)
4. **Updating projects**: Can only update projects in the current workspace
5. **Deleting projects**: Can only delete projects in the current workspace

**Security Note**: Cross-workspace access returns `404` instead of `403` to prevent information disclosure about the existence of projects in other workspaces.

---

## Default Workspace

Workspace ID `1` is the default workspace:

- **Created automatically** during database initialization
- **Cannot be deleted** (returns `403`)
- **Cannot be renamed** (returns `403`)
- **Description can be updated**
- **Used by default** when `X-Workspace-Id` header is not provided

---

## Business Rules Summary

### Workspaces
- ✅ Workspace names must be unique
- ✅ Default workspace (id=1) cannot be deleted
- ✅ Default workspace (id=1) cannot be renamed
- ✅ Workspaces with projects cannot be deleted
- ✅ Empty workspaces can be deleted freely

### Projects
- ✅ Projects are filtered by workspace
- ✅ Cross-workspace access returns 404
- ✅ Projects default to workspace_id=1 if header not provided
- ✅ Workspace must exist when creating a project

---

## Example Workflows

### Create a New Workspace and Add Projects

```bash
# 1. Create a workspace
curl -X POST http://localhost:8000/api/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "Q4 Videos", "description": "Video projects for Q4"}'
# Response: {"id": 2, "name": "Q4 Videos", ...}

# 2. Create projects in the new workspace
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -H "X-Workspace-Id: 2" \
  -d '{"name": "Holiday Special", "description": "Holiday video"}'

curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -H "X-Workspace-Id: 2" \
  -d '{"name": "Year in Review", "description": "Annual recap"}'

# 3. List projects in workspace
curl -H "X-Workspace-Id: 2" http://localhost:8000/api/projects
```

### Switch Between Workspaces

```bash
# View projects in default workspace
curl http://localhost:8000/api/projects

# View projects in another workspace
curl -H "X-Workspace-Id: 2" http://localhost:8000/api/projects
```

### Attempt to Delete Workspace with Projects

```bash
# This will fail with 400 Bad Request
curl -X DELETE http://localhost:8000/api/workspaces/2

# Must delete or move projects first
curl -X DELETE -H "X-Workspace-Id: 2" http://localhost:8000/api/projects/10
curl -X DELETE -H "X-Workspace-Id: 2" http://localhost:8000/api/projects/11

# Now can delete empty workspace
curl -X DELETE http://localhost:8000/api/workspaces/2
```

---

## Testing

See `backend/unit_tests/test_workspaces_api.py` and `backend/unit_tests/test_projects_api.py` for comprehensive test coverage of all workspace and project endpoints.

**Test Coverage**: 95.90%

---

## Implementation Notes

- Workspace filtering is implemented via FastAPI dependency injection
- The `get_workspace_id()` dependency extracts the header value
- Database queries filter by `workspace_id` column
- Default workspace is created in test fixtures and migrations
- Project count is computed dynamically for workspace responses

---

## Future Enhancements

Potential future enhancements (not in current scope):

- User-based workspace permissions
- Workspace sharing and collaboration
- Workspace templates
- Project move/copy between workspaces
- Workspace archiving
- Workspace-level settings

---

**Last Updated**: October 30, 2025  
**Related Issues**: #92, #91
