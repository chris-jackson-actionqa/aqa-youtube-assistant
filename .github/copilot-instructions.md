# GitHub Copilot Instructions - YouTube Assistant Project

## Project Overview

**Project Name**: YouTube Assistant  
**Purpose**: A full-stack application to help content creators plan, organize, and manage YouTube video ideas and production workflows.  
**Repository**: chris-jackson-actionqa/aqa-youtube-assistant

## Architecture & Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLAlchemy ORM with SQLite (development)
- **API Style**: RESTful JSON APIs
- **Authentication**: TBD

### Frontend
- **Framework**: Next.js (TypeScript/React)
- **Styling**: Tailwind CSS
- **Port**: localhost:3000 (development)

### Integration
- CORS configured between frontend and backend
- API endpoints prefixed with `/api/`

## Knowledge Management Strategy

### 1. Core Documentation Locations

- **`/README.md`** - Main project overview and getting started guide
- **`/docs/`** - Project-wide documentation, architecture decisions, and requirements
- **`/backend/README.md`** - Backend setup, API endpoints, and data models
- **`/backend/docs/`** - Backend-specific documentation, API specs
- **`/frontend/README.md`** - Frontend setup and component guidelines
- **`/frontend/docs/`** - Frontend-specific documentation, component specs

### 2. GitHub Issues as Context

- **Epic Issues**: High-level features with detailed descriptions and acceptance criteria
- **Task Issues**: Specific implementation tasks linked to epics
- **Labels**: Use for categorization (`feature`, `bug`, `documentation`, `enhancement`, `ai-context`)
- **Issue References**: Link commits, PRs, and code comments to relevant issues using `#issue-number`

### 3. Architecture Decision Records (ADRs)

- Location: `/docs/adr/`
- Format: `ADR-NNN-title.md`
- Include: Context, Decision, Consequences, Alternatives Considered
- Update when making significant architectural changes

### 4. Code-Level Documentation

**Python (Backend)**:
- Use docstrings for all functions, classes, and modules
- Include type hints for function parameters and return values
- Reference related documentation in docstrings

```python
"""
Module description here.
Related: See docs/VIDEO_WORKFLOW.md for business logic
"""

def create_video(title: str, description: str) -> Video:
    """
    Create a new video idea.
    
    Args:
        title: Video title
        description: Video description
        
    Returns:
        Video: Created video object
        
    Related: Issue #42
    """
```

**TypeScript (Frontend)**:
- Use JSDoc comments for complex functions
- Document component props with TypeScript interfaces
- Add inline comments for non-obvious logic

### 5. Context Retrieval Guidelines

**When starting a new task**:
1. Check related GitHub issues for requirements and context
2. Review relevant documentation in `/docs/`
3. Search codebase for similar implementations
4. Check commit history for context on recent changes

**When making changes**:
1. Update related documentation
2. Reference issue numbers in commit messages
3. Add code comments for complex logic
4. Update API documentation if endpoints change

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints for all function signatures
- Prefer Pydantic models for request/response schemas
- Use dependency injection for database sessions
- Keep route handlers thin, move logic to service functions
- Write docstrings for all public functions

### TypeScript (Frontend)

- Use functional components with hooks
- Prefer TypeScript interfaces over types for object shapes
- Use async/await for asynchronous operations
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types, avoid `any`

### General Practices

- Write descriptive commit messages following conventional commits
- Keep functions small and focused (single responsibility)
- Prefer composition over inheritance
- Write self-documenting code with clear variable/function names
- Add comments to explain "why", not "what"

## Project-Specific Patterns

### API Endpoints

- Prefix all API routes with `/api/`
- Use RESTful conventions (GET, POST, PUT, DELETE)
- Return consistent JSON response formats
- Include proper HTTP status codes
- Handle errors with descriptive messages

### Database Models

- Use SQLAlchemy declarative models in `backend/app/models.py`
- Create corresponding Pydantic schemas for API validation
- Use migrations for schema changes (when migration system added)

### State Management (Frontend)

- TBD - Define patterns as project evolves

### Error Handling

- Backend: Use FastAPI exception handlers
- Frontend: Display user-friendly error messages
- Log errors appropriately for debugging

## Development Workflow

1. **Planning**: Create GitHub issue with requirements and acceptance criteria
2. **Implementation**: Work on feature branch (branch from `main` or current development branch)
3. **Documentation**: Update relevant docs and code comments
4. **Testing**: Write/update tests as appropriate
5. **Review**: Create PR with description linking to issue
6. **Merge**: Squash and merge with meaningful commit message

## MCP Server Tools

This project uses Model Context Protocol (MCP) servers to enhance development workflow. Use these tools for the following operations:

### GitHub MCP Server

**Project Management**:
- Creating and managing GitHub issues for features, bugs, and tasks
- Organizing work with labels, milestones, and assignees
- Tracking project progress through issue states
- Creating and updating pull requests

**Source Code Management**:
- Local Git operations: `git add`, `git commit`, `git status`
- Viewing diffs (staged and unstaged changes)
- Managing branches and commits
- Git log and history

**Issue Tracking**:
- **Epics**: Create high-level feature issues with detailed descriptions and acceptance criteria
- **Stories**: Create task issues for specific implementations
- **Bugs**: Track and manage bug reports
- **Other Tickets**: Documentation tasks, technical debt, research spikes, etc.

### Chroma DB MCP Server

**Context Management**:
- Store relevant project context between chat sessions
- Maintain knowledge base of decisions, patterns, and conventions
- Query stored context for related information
- Persist important discussions and resolutions

### Markitdown MCP Server

**Document Conversion**:
- Convert documents to Markdown format as needed
- Process external documentation for integration into project docs
- Standardize document formats across the project

## AI Assistant Guidelines

**When assisting with this project**:

1. **Context First**: Always check existing documentation and issues before suggesting implementations
2. **Consistency**: Follow established patterns in the codebase
3. **Documentation**: Remind to update docs when making significant changes
4. **Issue Linking**: Suggest creating or linking to GitHub issues for new features
5. **Best Practices**: Recommend testing, error handling, and validation
6. **Ask Questions**: When requirements are unclear, ask before implementing
7. **Use MCP Tools**: Leverage GitHub MCP for project management and Git operations, Chroma DB for context persistence

**Use these references**:
- Check `/docs/` for project-wide documentation
- Review existing models and endpoints for patterns
- Search issues for related discussions and decisions
- Look at commit history for context on changes
- Query Chroma DB for stored context from previous sessions

## Key Project Files

- `/backend/app/main.py` - FastAPI application and route definitions
- `/backend/app/models.py` - SQLAlchemy database models
- `/backend/app/database.py` - Database configuration and session management
- `/frontend/app/page.tsx` - Main frontend page component
- `/backend/requirements.txt` - Python dependencies
- `/frontend/package.json` - Node.js dependencies

## Common Tasks

### Adding a new API endpoint
1. Define Pydantic schema (if needed)
2. Add route handler in `main.py` or separate router
3. Update database models if needed
4. Document endpoint behavior
5. Test with frontend integration

### Adding a new database model
1. Define SQLAlchemy model in `models.py`
2. Create Pydantic schemas for validation
3. Update database (migrations when available)
4. Create corresponding API endpoints
5. Update documentation

### Adding a new frontend component
1. Create component in appropriate directory
2. Define TypeScript interfaces for props
3. Integrate with backend API
4. Add error handling and loading states
5. Style with Tailwind CSS

## Questions or Clarifications

If context is unclear:
- Check GitHub issues for requirements
- Review existing documentation
- Ask the user for clarification
- Suggest creating documentation if it doesn't exist

---

**Last Updated**: October 19, 2025  
**Maintained By**: Project Team
