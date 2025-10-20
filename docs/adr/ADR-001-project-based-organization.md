# ADR-001: Project-Based Organization Structure

**Date**: October 19, 2025  
**Status**: Accepted  
**Context**: Initial architecture for organizing YouTube video production work

## Context

We need a way for users to organize their YouTube video production work. Users may be working on multiple videos simultaneously, and each video production involves multiple artifacts (ideas, scripts, notes, etc.). We need to decide on the primary organizational structure for the application.

## Decision

We will implement a **project-based organization structure** where:

1. A **Project** is the workspace for creating **one YouTube video**
2. Each project has a user-defined name for identification
3. Projects contain all metadata and artifacts for one video (from planning through publishing)
4. Projects support basic CRUD operations: Create, Load (Read), Update, Delete

**Simplified Architecture**: We use a **single entity (Project)** rather than separate Project and Video entities, since they represent the same concept.

## Rationale

### Why Project-Based Structure?

**Advantages**:
- **Process-Oriented**: "Project" emphasizes the production process from concept to published video
- **Workspace Concept**: Provides a clear workspace for organizing all materials for one video
- **Single Entity Simplicity**: No complexity of separate Project/Video entities with relationships
- **Natural Workflow**: Matches how creators think - "I'm working on a video project"
- **Standard Processes**: Easy to add templates and workflows for repeatable video creation processes

**Why Single Entity?**
- Project **is** the video being created - no need for separate entities
- Simpler database model - no foreign keys or one-to-one relationships
- Less confusing for users - they work with "projects", not "projects and videos"
- Can add fields for different lifecycle stages (planning fields, publishing fields, analytics fields)
- Easier to understand and maintain

### Why User-Defined Names?

**Advantages**:
- **Familiar**: Users understand naming things
- **Flexible**: No restrictions on how users organize
- **Simple**: No need for complex taxonomy or templates initially

**Alternative Considered**: Structured metadata (video type, category, etc.)
- Too rigid for initial version
- Users may not fit into predefined categories
- Can be added as optional metadata later

### Why Include All CRUD Operations?

**Create**: Essential for starting new work  
**Load/Read**: Essential for viewing and selecting projects  
**Update**: Allows users to refine project details over time  
**Delete**: Necessary for cleanup and workspace management

## Consequences

### Positive
- Clear, understandable data model with single entity
- Simple to implement - no relationships to manage
- No confusion between "project" and "video" concepts
- Easy to add fields as the project progresses through stages
- Matches user mental model perfectly

### Negative
- May need many optional fields as we add features (video_title, published_url, etc.)
- Single table could become wide with many columns
- Need to handle lifecycle state management within one entity

## Future Considerations

TBD

### Not Planned (Out of Scope)
- Video grouping/series management - This tool focuses on individual video creation
- Multi-video campaigns - Each video gets its own project
- Cross-project organization - Keep it simple, one project = one video

### Architecture Evolution
- Monitor if Project/Video separation provides value or just adds complexity
- Consider merging into single entity if separation proves unnecessary
- Current two-entity model provides flexibility to evolve as needs become clearer

## Implementation Notes

### Data Model
```
Project (single entity)
  - id (PK)
  - name (required, user-defined - represents the video project)
  - description (optional - project notes)
  - status (planned, scripting, filming, editing, published)
  - created_at
  - updated_at
  
  # Future fields as project progresses:
  - video_title (final published title, may differ from working name)
  - video_description (final published description)
  - thumbnail_url
  - published_url
  - published_at
  # ... other fields as needed
```

### Lifecycle Approach
- Single entity evolves through the video creation lifecycle
- Status field tracks current stage (planned → scripting → filming → editing → published)
- Optional fields populate as project progresses (e.g., published_url only when published)
- Simple and straightforward - no cascade deletes or relationship management

### Performance Considerations
- Index on project name for searching
- Index on created_at for sorting
- Consider pagination when listing projects

## Related

- Epic Issue: #2
- Documentation: `/docs/PROJECT_MANAGEMENT.md`
- Related Issues: #3, #4, #5, #6, #7

## Review Notes

This ADR should be reviewed after:
- User feedback on the project organization model
- Implementation of initial version
- Consideration of advanced features (templates, sharing, etc.)

---

**Last Updated**: October 19, 2025
