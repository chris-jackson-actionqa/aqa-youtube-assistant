# aqa-youtube-assistant

[![CI - All Tests](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/ci.yml)
[![Backend Tests](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/backend-tests.yml)
[![Frontend Tests](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/frontend-tests.yml/badge.svg)](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/frontend-tests.yml)
[![E2E Tests](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/e2e-tests.yml)

Helper for planning and making YouTube videos for the ActionaQA channel.

This application consists of a **Next.js frontend** and a **FastAPI backend**.

## Project Structure

```
aqa-youtube-assistant/
├── frontend/          # Next.js application (TypeScript, Tailwind CSS)
├── backend/           # FastAPI application (Python)
└── README.md          # This file
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- pip

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
uvicorn app.main:app --reload
```

The backend API will be available at http://localhost:8000

- API Documentation (Swagger): http://localhost:8000/docs
- Alternative API Documentation (ReDoc): http://localhost:8000/redoc

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Development

### Git Hooks

This project uses Git hooks to maintain code quality. A pre-commit hook automatically runs linting, type checking, and tests before each commit.

**Pre-commit Hook**: Located at `.githooks/pre-commit`, this hook:
- Runs **Ruff** linting checks on backend code
- Runs **mypy** type checking on backend code
- Runs all unit tests in `backend/unit_tests/`
- Runs all frontend tests with coverage
- Blocks the commit if any checks fail
- Provides clear feedback on what needs to be fixed

**Installation** (required for fresh clones):

```bash
# Copy the hook template to your local .git/hooks directory
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Requirements for backend checks:**
```bash
# Install development dependencies
cd backend
pip install -r requirements-dev.txt
# If needed, ensure it's executable:
chmod +x .git/hooks/pre-commit
```

**Bypassing the hook** (not recommended): If you need to commit without running tests:
```bash
git commit --no-verify -m "your message"
```

### Backend Development

The FastAPI backend provides RESTful API endpoints for managing YouTube projects. Key files:

- `backend/app/main.py` - Main application file with API routes
- `backend/app/models.py` - SQLAlchemy database models
- `backend/app/schemas.py` - Pydantic validation schemas
- `backend/requirements.txt` - Python dependencies

API Endpoints:
- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/projects` - List all projects (no pagination in MVP - returns all projects)
- `POST /api/projects` - Create new project (with duplicate name validation)
- `GET /api/projects/{id}` - Get specific project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

**Note**: Pagination is deferred for MVP. The `GET /api/projects` endpoint returns all projects, which is acceptable for the expected scale (~52 projects per year). See `docs/test-plans/PROJECT_FEATURE_DECISIONS.md` (Decision #7) for details.

### Backend Testing

The backend has comprehensive test coverage:

- **Unit Tests**: 25 tests in `backend/unit_tests/` (96% coverage)
- **Integration Tests**: 15 tests in `backend/integration_tests/`
- **Total**: 40 tests, all passing

Run tests:
```bash
cd backend

# Run all tests
pytest

# Run only unit tests
pytest unit_tests/

# Run only integration tests
pytest integration_tests/

# Run with coverage report
pytest --cov=app --cov-report=term-missing

# Run verbose mode
pytest -v
```

See `backend/docs/` for detailed testing documentation.

### Frontend Development

The Next.js frontend provides a user interface to interact with the backend API. Key files:

- `frontend/app/page.tsx` - Main page component
- `frontend/app/layout.tsx` - Root layout
- `frontend/app/globals.css` - Global styles

## Building for Production

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## License

This project is for the ActionaQA YouTube channel.

