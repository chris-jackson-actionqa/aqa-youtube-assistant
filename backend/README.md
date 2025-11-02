# YouTube Assistant Backend

FastAPI backend for the YouTube Assistant application.

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. For development, install development dependencies:
```bash
pip install -r requirements-dev.txt
```

## Code Quality Tools

This project uses modern Python linting and formatting tools:

### Ruff (Linter & Formatter)

Ruff is an extremely fast all-in-one Python linter and formatter that replaces multiple tools (Flake8, isort, Black, etc.).

**Format code:**
```bash
make format
# or
ruff format .
ruff check --fix .
```

**Check code (without fixing):**
```bash
make lint
# or
ruff check .
```

### mypy (Type Checker)

mypy provides static type checking for Python code.

**Run type checking:**
```bash
make type-check
# or
mypy app/
```

### Configuration

All linting and formatting configurations are in `pyproject.toml`:
- **Ruff**: Line length 88, PEP 8 compliance, import sorting
- **mypy**: Type checking with Pydantic plugin support

### Pre-Commit Testing

Tests automatically run before each commit via Git hooks to ensure code quality.

## Testing

The backend has comprehensive test coverage with pytest.

**Run all tests:**
```bash
make test
# or
pytest unit_tests/ integration_tests/ -v --cov=app --cov-report=term
```

**Run only unit tests:**
```bash
pytest unit_tests/ -v
```

**Run only integration tests:**
```bash
pytest integration_tests/ -v
```

**Generate HTML coverage report:**
```bash
pytest --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

**Coverage Requirements:**
- Minimum coverage: 95%
- Target: Near 100% for all new code
- Configuration in `pyproject.toml`

## Development Workflow

1. Install development dependencies: `pip install -r requirements-dev.txt`
2. Make code changes
3. Format code: `make format`
4. Check linting: `make lint`
5. Run type checking: `make type-check`
6. Run tests: `make test`
7. Commit changes (tests run automatically via pre-commit hook)

## Running the Application

Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

## API Documentation

- [Workspace API Documentation](docs/WORKSPACE_API.md) - Complete guide to workspace CRUD endpoints and workspace filtering
- [Postman Collection Documentation](docs/POSTMAN_COLLECTION.md) - API testing examples

## Database Management

- [Database Management Guide](docs/DATABASE_MANAGEMENT.md) - **Important:** Understanding development vs test databases, migrations, and environment variables

⚠️ **Critical:** The backend uses **separate SQLite files** for development (`youtube_assistant.db`) and E2E tests (`youtube_assistant_test.db`). When making schema changes, ensure migrations run on **both** databases. See the Database Management Guide for details.

### Alembic Migrations

The project uses Alembic for database schema migrations. Alembic allows you to version control your database schema and automatically generate migrations based on model changes.

**Configuration:**
- Database URL is configured via the `DATABASE_URL` environment variable
- Default: `sqlite:///./youtube_assistant.db`
- Future: Will support PostgreSQL connection strings

**Common Alembic Commands:**

```bash
# Create a new migration (auto-generate from model changes)
alembic revision --autogenerate -m "Description of changes"

# Apply all pending migrations
alembic upgrade head

# Rollback to previous version
alembic downgrade -1

# Rollback all migrations
alembic downgrade base

# Show current version
alembic current

# Show migration history
alembic history

# Show SQL that would be executed (without running)
alembic upgrade head --sql
```

**Migration Workflow:**
1. Modify models in `app/models.py`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review the generated migration file in `alembic/versions/`
4. Test migration: `alembic upgrade head`
5. Test rollback: `alembic downgrade -1` then `alembic upgrade head`
6. Commit both model changes and migration file

**Important Notes:**
- Always review auto-generated migrations before applying
- Some changes (like expression-based indexes) require manual migration edits
- Keep test suite using `Base.metadata.create_all()` for speed
- Only integration tests should use Alembic migrations
- The `alembic_version` table tracks the current database version

## API Endpoints

- `GET /` - Root endpoint with API information
- `GET /api/health` - Health check endpoint
- `GET /api/projects` - Get list of all projects (no pagination - returns all)
- `POST /api/projects` - Create a new project (validates uniqueness, max lengths)
- `GET /api/projects/{id}` - Get specific project by ID
- `PUT /api/projects/{id}` - Update existing project
- `DELETE /api/projects/{id}` - Delete project (hard delete with confirmation)

**Browser Support**: Firefox only (desktop). See `docs/test-plans/PROJECT_FEATURE_DECISIONS.md` (Decision #8).

**Data Model**: Single entity (`Project`). Each project represents one YouTube video idea with name, description, and status.

**Pagination**: Deferred for MVP. All endpoints return complete datasets, which is acceptable for the expected scale (~52 projects/year). See Decision #7 in test planning documentation.
