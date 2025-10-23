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

## Running the Application

Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

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
