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

**CRITICAL**: All development work MUST follow the [Git and GitHub Workflow Checklist](.github/workflows/GIT_GITHUB_WORKFLOW_CHECKLIST.md).

### Git Workflow Requirements

**Before ANY code changes**:
1. **Branch First**: NEVER work directly on `main` - always create a feature branch
2. **Update Main**: Ensure `main` is up to date before branching
3. **Proper Naming**: Use branch naming conventions (`feature/`, `fix/`, `docs/`, `test/`)

**During development**:
1. **Small Commits**: Make one logical change at a time
2. **Test First**: Run tests before every commit
3. **Conventional Commits**: Follow commit message conventions (`feat:`, `fix:`, `test:`, `docs:`)

**Before committing**:
- Follow the [Pre-Commit Checklist](.github/workflows/GIT_GITHUB_WORKFLOW_CHECKLIST.md#-pre-commit-checklist)
- All tests must pass
- Coverage thresholds must be met

**Creating Pull Requests**:
- Follow the [PR Creation Checklist](.github/workflows/GIT_GITHUB_WORKFLOW_CHECKLIST.md#-creating-a-pull-request)
- Link to related issues using `Fixes #XX` or `Related to #XX`
- Include clear description of changes and testing performed

### Standard Workflow Steps

1. **Planning**: Create GitHub issue with requirements and acceptance criteria
2. **Branching**: Create feature branch following [workflow checklist](.github/workflows/GIT_GITHUB_WORKFLOW_CHECKLIST.md#-before-starting-work)
3. **Implementation**: Work in small increments with frequent commits
4. **Documentation**: Update relevant docs and code comments
5. **Testing**: Write/update tests as appropriate (enforced by pre-commit hook)
6. **Review**: Create PR with description linking to issue
7. **Merge**: Squash and merge with meaningful commit message

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

## Specialized Copilot Prompts

The project includes specialized prompts for specific workflows in `.github/copilot-prompts/`:

### 🧪 Jest Unit Tester (`.github/copilot-prompts/jest-unit-tester.md`)
**Purpose**: Comprehensive Jest testing agent for frontend components  
**When to use**: Writing tests, improving coverage, debugging test failures  
**Coverage target**: 98-100% for statements, branches, functions, lines

**Invoke by**:
- Attaching the file: `#file:.github/copilot-prompts/jest-unit-tester.md`
- Natural language: "Write Jest tests for ComponentName"
- Workspace reference: `@workspace` with testing keywords

See `.github/copilot-prompts/README.md` for full list of available prompts.

## AI Assistant Guidelines

**When assisting with this project**:

1. **Git Workflow First**: ALWAYS follow the [Git and GitHub Workflow Checklist](.github/workflows/GIT_GITHUB_WORKFLOW_CHECKLIST.md)
   - **Never commit to main directly**
   - Create feature branch before any code changes
   - Follow branch naming conventions
   - Use conventional commit messages
2. **Context First**: Always check existing documentation and issues before suggesting implementations
3. **Consistency**: Follow established patterns in the codebase
4. **Documentation**: Remind to update docs when making significant changes
5. **Issue Linking**: Suggest creating or linking to GitHub issues for new features
6. **Best Practices**: Recommend testing, error handling, and validation
7. **Ask Questions**: When requirements are unclear, ask before implementing
8. **Use MCP Tools**: Leverage GitHub MCP for project management and Git operations, Chroma DB for context persistence
9. **Use Specialized Prompts**: Invoke task-specific prompts (like jest-unit-tester) for complex workflows
10. **Branch Verification**: Before making ANY code changes, verify you're on a feature branch (not main)

**Use these references**:
- Check `/docs/` for project-wide documentation
- Review existing models and endpoints for patterns
- Search issues for related discussions and decisions
- Look at commit history for context on changes
- Query Chroma DB for stored context from previous sessions
- Use `.github/copilot-prompts/` for specialized task workflows

## Key Project Files

- `/backend/app/main.py` - FastAPI application and route definitions
- `/backend/app/models.py` - SQLAlchemy database models
- `/backend/app/database.py` - Database configuration and session management
- `/frontend/app/page.tsx` - Main frontend page component
- `/backend/requirements.txt` - Python dependencies
- `/frontend/package.json` - Node.js dependencies

## Testing Standards

### Frontend Testing (Jest)
- **Framework**: Jest 30.2.0 + React Testing Library 16.3.0
- **Coverage Thresholds**: 98% (statements, branches, functions, lines)
- **Target**: 100% coverage
- **Pre-commit Hook**: Automatically runs tests before commits
- **Detailed Guide**: See `.github/copilot-prompts/jest-unit-tester.md`

### Backend Testing (Pytest)
- **Framework**: Pytest with coverage plugin
- **Coverage Thresholds**: 95% (statements, branches, functions, lines)
- **Test Organization**: `backend/unit_tests/` and `backend/integration_tests/`
- **Pre-commit Hook**: Automatically runs tests before commits

### When to Write Tests
- **Always** when adding new components, functions, or API endpoints
- **Before** committing code (enforced by pre-commit hook)
- **To achieve** 98%+ coverage (frontend) or 95%+ coverage (backend)
- **For test-driven development**: Write tests first, then implementation

### How to Invoke Jest Testing Agent
For comprehensive frontend testing assistance, reference the specialized prompt:
```
#file:.github/copilot-prompts/jest-unit-tester.md
Add unit tests for ComponentName with 100% coverage
```

Or use natural language with testing keywords:
```
Write Jest tests for the UserProfile component
```

## Common Tasks

### Adding a new API endpoint
1. Define Pydantic schema (if needed)
2. Add route handler in `main.py` or separate router
3. Update database models if needed
4. Document endpoint behavior
5. **Write unit tests** (backend/unit_tests/)
6. Test with frontend integration

### Adding a new database model
1. Define SQLAlchemy model in `models.py`
2. Create Pydantic schemas for validation
3. Update database (migrations when available)
4. Create corresponding API endpoints
5. **Write unit tests** for CRUD operations
6. Update documentation

### Adding a new frontend component
1. Create component in appropriate directory
2. Define TypeScript interfaces for props
3. Integrate with backend API
4. Add error handling and loading states
5. Style with Tailwind CSS
6. **Write unit tests** (see `.github/copilot-prompts/jest-unit-tester.md`)

## Questions or Clarifications

If context is unclear:
- Check GitHub issues for requirements
- Review existing documentation
- Ask the user for clarification
- Suggest creating documentation if it doesn't exist

---

**Last Updated**: October 19, 2025  
**Maintained By**: Project Team
