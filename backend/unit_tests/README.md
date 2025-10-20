# Unit Tests

This directory contains unit tests for the YouTube Assistant backend API.

## Structure

```
unit_tests/
├── __init__.py           # Package initialization
├── conftest.py           # Pytest fixtures and configuration
└── test_projects_api.py  # Tests for Projects CRUD API
```

## Running Tests

### Run all unit tests:
```bash
cd backend
pytest unit_tests/
```

### Run with coverage report:
```bash
pytest unit_tests/ --cov=app --cov-report=term-missing
```

### Run specific test file:
```bash
pytest unit_tests/test_projects_api.py
```

### Run specific test class:
```bash
pytest unit_tests/test_projects_api.py::TestCreateProject
```

### Run specific test:
```bash
pytest unit_tests/test_projects_api.py::TestCreateProject::test_create_project_success
```

### Run tests with verbose output:
```bash
pytest unit_tests/ -v
```

### Run tests and stop on first failure:
```bash
pytest unit_tests/ -x
```

## Test Coverage

The unit tests cover the following areas:

### Health Check (`TestHealthCheck`)
- ✅ API health status endpoint

### Create Project (`TestCreateProject`)
- ✅ Successful project creation
- ✅ Creating project with minimal required fields
- ✅ Duplicate title validation (exact match)
- ✅ Duplicate title validation (case-insensitive)
- ✅ Missing title validation
- ✅ Empty title validation

### Get Projects (`TestGetProjects`)
- ✅ Empty project list
- ✅ Single project retrieval
- ✅ Multiple projects retrieval

### Get Project by ID (`TestGetProjectById`)
- ✅ Successful retrieval by ID
- ✅ 404 for non-existent project
- ✅ Invalid ID format validation

### Update Project (`TestUpdateProject`)
- ✅ Full update (all fields)
- ✅ Partial update (some fields)
- ✅ Update with same title (allowed)
- ✅ Duplicate title validation on update
- ✅ Case-insensitive duplicate validation
- ✅ 404 for non-existent project
- ✅ Empty title validation
- ✅ Timestamp updates

### Delete Project (`TestDeleteProject`)
- ✅ Successful deletion
- ✅ 404 for non-existent project
- ✅ Verification of deletion in project list

### Root Endpoint (`TestRootEndpoint`)
- ✅ API information endpoint

## Fixtures

### `db_session`
Provides a fresh in-memory SQLite database for each test, ensuring test isolation.

### `client`
Provides a FastAPI TestClient with overridden database dependency for testing endpoints.

### `sample_project_data`
Provides sample project data dictionary for testing.

### `create_sample_project`
Factory fixture that creates projects in the test database with customizable fields.

## Testing Strategy

1. **Test Isolation**: Each test uses a fresh in-memory database
2. **Comprehensive Coverage**: Tests cover success cases, error cases, and edge cases
3. **Clear Test Names**: Test function names clearly describe what is being tested
4. **Organized Classes**: Tests are grouped by endpoint/functionality
5. **Fixtures**: Reusable fixtures reduce code duplication

## Writing New Tests

When adding new endpoints or functionality:

1. Create a new test class for the feature (e.g., `TestNewFeature`)
2. Write tests for success cases first
3. Add tests for error cases (404, 400, 422)
4. Add tests for edge cases
5. Use descriptive test names that explain the scenario
6. Use fixtures from `conftest.py` or create new ones as needed

Example:
```python
class TestNewFeature:
    """Tests for new feature endpoint."""
    
    def test_new_feature_success(self, client):
        """Test successful use of new feature."""
        response = client.get("/api/new-feature")
        assert response.status_code == 200
    
    def test_new_feature_error_case(self, client):
        """Test error handling in new feature."""
        response = client.get("/api/new-feature/invalid")
        assert response.status_code == 404
```

## CI/CD Integration

These tests are designed to be run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Unit Tests
  run: |
    cd backend
    pytest unit_tests/ --cov=app --cov-report=xml
```

## Dependencies

Testing dependencies are listed in `requirements.txt`:
- `pytest` - Testing framework
- `pytest-cov` - Coverage reporting
- `httpx` - Required by FastAPI TestClient
