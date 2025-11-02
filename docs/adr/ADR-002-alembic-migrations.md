# ADR-002: Use Alembic for Database Migrations

## Status
Accepted

## Context
We need a reliable way to manage database schema changes across development, testing, and production environments. Manual migration scripts are error-prone and don't scale.

## Decision
Use Alembic as our database migration tool with automatic migrations on application startup.

## Consequences

### Positive
- Automatic schema updates on app startup
- Version-controlled migrations
- Rollback capability
- Industry-standard tool
- Works with SQLite and PostgreSQL

### Negative
- Additional dependency
- Learning curve for team
- Need to review auto-generated migrations

### Neutral
- Test fixtures continue using `Base.metadata.create_all()` for speed
- Migrations only run in integration tests and production

## Implementation
- Migrations live in `backend/alembic/versions/`
- Configured via `alembic.ini` and `alembic/env.py`
- Automatic execution via FastAPI lifespan events
- See Migration Workflow Guide for usage
