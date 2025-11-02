# Documentation Index

This document provides a quick reference to all project documentation.

## Getting Started
- **[README.md](/README.md)** - Main project overview and setup instructions
- **[Backend README](/backend/README.md)** - Backend-specific setup and information
- **[Frontend README](/frontend/README.md)** - Frontend-specific setup and information

## Planning & Requirements
- **[Planning Summary](PLANNING_SUMMARY.md)** - Summary of completed planning work
- **[Project Management](PROJECT_MANAGEMENT.md)** - Feature specification for project management

## Deployment & Operations
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions for development and production
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment verification checklist
- **[Migration Workflow](MIGRATION_WORKFLOW.md)** - Database migration procedures and best practices

## Architecture Decisions
- **[ADR-001: Project-Based Organization](adr/ADR-001-project-based-organization.md)** - Why we chose projects as the primary organizational structure

## GitHub Issues

### Completed Epics
- ✅ **[Epic #90: Multi-Workspace Support](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/90)** - Workspace organization and parallel E2E test execution (Completed Nov 1, 2025)

### Active Epics
- 🚧 **[Epic #2: Project Management](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/2)** - Create, load, and delete projects (60% complete)
- 🚧 **[Epic #96: Alembic Database Migrations](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/96)** - Automated migration system (Phase 1 ready)

### Recent Completions
- ✅ Issue #91-95 - Multi-Workspace Support (All sub-issues)
- ✅ Issue #50 - Test Isolation Strategy (Closed by Epic #90)
- ✅ Issue #3, #4 - Backend Project API
- ✅ Issue #28 - Frontend Form Validation

## Development Resources

### Key Files
- `/backend/app/main.py` - FastAPI application and routes
- `/backend/app/models.py` - Database models
- `/backend/app/database.py` - Database configuration
- `/frontend/app/page.tsx` - Main frontend page

### Standards & Guidelines
- **[Copilot Instructions](../.github/copilot-instructions.md)** - AI assistant guidelines and project conventions

## Future Documentation

As the project grows, we'll add:
- API Reference
- Component Library
- Contributing Guidelines
- Testing Strategy
- Security Policies

---

**Last Updated**: November 1, 2025  
**Maintained By**: Project Team
