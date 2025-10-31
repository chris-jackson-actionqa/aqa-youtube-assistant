# Database Management Guide

This document explains how databases are managed across different environments in the AQA YouTube Assistant backend.

## Database Files Overview

The backend uses SQLite with **different database files** for different environments:

| Environment | Database File | Location | Environment Variable |
|------------|---------------|----------|---------------------|
| **Development** | `youtube_assistant.db` | `backend/youtube_assistant.db` | `DATABASE_URL` (default) |
| **Unit Tests** | In-memory | N/A | Set by test fixtures |
| **Integration Tests** | `youtube_assistant_test.db` | `backend/integration_tests/youtube_assistant_test.db` | Set by test fixtures |
| **E2E Tests (CI)** | `youtube_assistant_test.db` | `backend/youtube_assistant_test.db` | `DATABASE_URL=sqlite:///./youtube_assistant_test.db` |

## ⚠️ Important: Separate Database Files

**Critical:** Development and E2E tests use **separate database files**. Changes to the development database do **not** automatically propagate to the test database.

### Common Mistake
❌ Making schema changes → Testing locally with dev DB → E2E tests fail in CI because test DB not migrated

✅ **Always migrate BOTH databases when making schema changes**

## Database Configuration

### Default Configuration (`app/database.py`)
```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./youtube_assistant.db")
```

The backend uses the `DATABASE_URL` environment variable to determine which database to connect to:
- **Not set:** Uses `youtube_assistant.db` (development database)
- **Set:** Uses the specified database URL

### Migration Script (`migrate_add_workspaces.py`)
```python
database_url = os.getenv("DATABASE_URL", "sqlite:///./youtube_assistant.db")
```

The migration script **also** respects `DATABASE_URL`, so it will migrate whichever database you specify.

## Migrating Databases

### Development Database (Local)
```bash
cd backend
python migrate_add_workspaces.py
```
This migrates `youtube_assistant.db` (the default).

### Test Database (E2E CI)
```bash
cd backend
DATABASE_URL="sqlite:///./youtube_assistant_test.db" python migrate_add_workspaces.py
```
This migrates the E2E test database.

### Both Databases (Recommended)
```bash
cd backend
# Migrate development database
python migrate_add_workspaces.py
# Migrate E2E test database
DATABASE_URL="sqlite:///./youtube_assistant_test.db" python migrate_add_workspaces.py
```

## E2E Tests in CI/CD

The GitHub Actions E2E workflow (`.github/workflows/e2e-tests.yml`) handles database setup:

```yaml
- name: Initialize database
  working-directory: backend
  env:
    DATABASE_URL: "sqlite:///./youtube_assistant_test.db"
  run: |
    python migrate_add_workspaces.py

- name: Start backend server
  working-directory: backend
  env:
    DATABASE_URL: "sqlite:///./youtube_assistant_test.db"
  run: |
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

**Key Points:**
1. E2E tests set `DATABASE_URL` to `youtube_assistant_test.db`
2. Migration script runs **first** to initialize the test database
3. Backend server starts **with the same `DATABASE_URL`**
4. This ensures migration and server use the **same test database**

## When Schema Changes Are Made

### Checklist for Schema Changes
- [ ] Update models in `app/models.py`
- [ ] Update/create migration script
- [ ] Run migration on **development database** (`python migrate_add_workspaces.py`)
- [ ] Verify migration runs successfully
- [ ] Update E2E workflow if migration step needs changes
- [ ] Commit migration script changes
- [ ] E2E CI will automatically run migration on test database

### Why E2E Tests Fail After Schema Changes

If you add a new required field (like `workspace_id`) to the database:

1. ✅ **Unit tests pass:** They use in-memory databases recreated fresh each time
2. ✅ **Local dev works:** You migrated `youtube_assistant.db` locally
3. ❌ **E2E tests fail in CI:** `youtube_assistant_test.db` doesn't exist yet and needs migration

**Solution:** Ensure the E2E workflow runs the migration script before starting the server (this is now configured).

## Best Practices

### 1. Always Use Environment Variables
```bash
# Good: Explicit database selection
DATABASE_URL="sqlite:///./my_test.db" python app/main.py

# Also Good: Uses default development database
python app/main.py
```

### 2. Never Hardcode Database Paths
```python
# Bad
engine = create_engine("sqlite:///./youtube_assistant.db")

# Good
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./youtube_assistant.db")
engine = create_engine(DATABASE_URL)
```

### 3. Migration Scripts Must Respect DATABASE_URL
All migration scripts should:
```python
def get_engine():
    database_url = os.getenv("DATABASE_URL", "sqlite:///./youtube_assistant.db")
    return create_engine(database_url)
```

### 4. Document Database Requirements in PR
When making schema changes, add to PR description:
```markdown
## Database Changes
- ⚠️ Migration required: `python migrate_add_workspaces.py`
- Updated E2E workflow to run migration
```

## Troubleshooting

### E2E Tests Fail with "404 Not Found" on Project Creation
**Cause:** Database migration not run, default workspace (id=1) doesn't exist

**Solution:** 
1. Check E2E workflow has migration step
2. Verify migration runs before server starts
3. Ensure both use same `DATABASE_URL`

### Development Works But E2E Tests Fail
**Cause:** Migrated dev database but not test database

**Solution:**
```bash
DATABASE_URL="sqlite:///./youtube_assistant_test.db" python migrate_add_workspaces.py
```

### Schema Mismatch Errors
**Cause:** Database file has old schema, needs migration

**Solution:**
- Delete old database file: `rm youtube_assistant.db youtube_assistant_test.db`
- Run migrations fresh
- Or update migration script to handle existing schemas

## File Structure
```
backend/
├── youtube_assistant.db              # Development database (gitignored)
├── youtube_assistant_test.db         # E2E test database (gitignored)
├── app/
│   ├── database.py                   # Database configuration
│   ├── models.py                     # ORM models
│   └── main.py                       # FastAPI app
├── migrate_add_workspaces.py         # Migration script
├── integration_tests/
│   ├── conftest.py                   # Creates test DB per test
│   └── youtube_assistant_test.db     # Integration test DB (gitignored)
└── .gitignore                        # Ignores *.db files
```

## Summary

**Key Takeaway:** The backend uses **separate SQLite files** for development and E2E testing. Both the migration script and the application respect the `DATABASE_URL` environment variable, which allows you to control which database is used. Always ensure migrations run on **both** databases when making schema changes.

---

**Last Updated:** October 30, 2025  
**Related Issues:** #92 (Workspace CRUD), #91 (Multi-Workspace Support)
