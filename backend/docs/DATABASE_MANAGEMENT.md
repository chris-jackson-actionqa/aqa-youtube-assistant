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

### Alembic Configuration
Alembic is configured in `alembic/env.py` and `alembic.ini` to respect the `DATABASE_URL` environment variable:
```python
# In alembic/env.py
config.set_main_option(
    'sqlalchemy.url',
    os.getenv('DATABASE_URL', 'sqlite:///./youtube_assistant.db')
)
```

This allows Alembic to migrate whichever database you specify via the environment variable.

## Migrating Databases

The project uses **Alembic** for database migrations. All schema changes are managed through Alembic migration scripts.

### Development Database (Local)
```bash
cd backend
alembic upgrade head
```
This migrates `youtube_assistant.db` (the default).

### Test Database (E2E CI)
```bash
cd backend
DATABASE_URL="sqlite:///./youtube_assistant_test.db" alembic upgrade head
```
This migrates the E2E test database.

### Both Databases (Recommended)
```bash
cd backend
# Migrate development database
alembic upgrade head
# Migrate E2E test database
DATABASE_URL="sqlite:///./youtube_assistant_test.db" alembic upgrade head
```

### Creating New Migrations

When you make changes to models in `app/models.py`:

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

Review the generated migration file in `alembic/versions/` before applying it.

## E2E Tests in CI/CD

The GitHub Actions E2E workflow (`.github/workflows/e2e-tests.yml`) handles database setup:

```yaml
- name: Run database migrations
  working-directory: backend
  env:
    DATABASE_URL: "sqlite:///./youtube_assistant_test.db"
  run: |
    alembic upgrade head

- name: Start backend server
  working-directory: backend
  env:
    DATABASE_URL: "sqlite:///./youtube_assistant_test.db"
  run: |
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

**Key Points:**
1. E2E tests set `DATABASE_URL` to `youtube_assistant_test.db`
2. Alembic migration runs **first** to initialize the test database
3. Backend server starts **with the same `DATABASE_URL`**
4. This ensures migration and server use the **same test database**

## When Schema Changes Are Made

### Checklist for Schema Changes
- [ ] Update models in `app/models.py`
- [ ] Generate Alembic migration: `alembic revision --autogenerate -m "description"`
- [ ] Review generated migration file in `alembic/versions/`
- [ ] Run migration on **development database** (`alembic upgrade head`)
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

### 3. Use Alembic for All Schema Changes
```bash
# Create a new migration
alembic revision --autogenerate -m "Add new column"

# Apply migrations
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

### 4. Document Database Requirements in PR
When making schema changes, add to PR description:
```markdown
## Database Changes
- ⚠️ Migration required: `alembic upgrade head`
- New migration file: `alembic/versions/xxx_description.py`
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
DATABASE_URL="sqlite:///./youtube_assistant_test.db" alembic upgrade head
```

### Schema Mismatch Errors
**Cause:** Database file has old schema, needs migration

**Solution:**
- Run migrations: `alembic upgrade head`
- Or start fresh: `rm youtube_assistant.db && alembic upgrade head`

### Check Current Migration Status
```bash
alembic current    # Show current revision
alembic history    # Show all migrations
alembic heads      # Show latest available revision
```

## File Structure
```
backend/
├── youtube_assistant.db              # Development database (gitignored)
├── youtube_assistant_test.db         # E2E test database (gitignored)
├── alembic/                          # Alembic migration system
│   ├── versions/                     # Migration scripts
│   │   └── 71bc71cb8fac_*.py        # Initial schema migration
│   ├── env.py                        # Alembic environment config
│   └── script.py.mako                # Migration template
├── alembic.ini                       # Alembic configuration
├── app/
│   ├── database.py                   # Database configuration
│   ├── models.py                     # ORM models
│   └── main.py                       # FastAPI app
├── integration_tests/
│   ├── conftest.py                   # Creates test DB per test
│   └── youtube_assistant_test.db     # Integration test DB (gitignored)
└── .gitignore                        # Ignores *.db files
```

## Summary

**Key Takeaway:** The backend uses **separate SQLite files** for development and E2E testing. Database schema changes are managed through **Alembic migrations**. Both the migration system and the application respect the `DATABASE_URL` environment variable, which allows you to control which database is used. Always ensure migrations run on **both** databases when making schema changes.

---

**Last Updated:** November 1, 2025  
**Related Issues:** #102 (Alembic Implementation), #91 (Multi-Workspace Support)
