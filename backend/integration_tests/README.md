# Integration Tests

This directory contains integration tests for the YouTube Assistant backend API that use a **real SQLite database file** to verify database-specific behavior.

## 🔍 Difference from Unit Tests

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| **Database** | In-memory SQLite | Real SQLite file |
| **Persistence** | No (cleared each test) | Yes (file-based) |
| **Purpose** | Test logic in isolation | Test database behavior |
| **Speed** | Very fast | Fast |
| **Scope** | Individual functions | Component interactions |

## 📁 Structure

```
integration_tests/
├── __init__.py                      # Package initialization
├── conftest.py                      # Pytest fixtures with real database
├── test_projects_integration.py    # Integration tests for Projects API
└── README.md                        # This file
```

## 🎯 What These Tests Verify

### 1. **Database Persistence** (2 tests)
- ✅ Data persists in database file across operations
- ✅ Multiple CRUD operations maintain data integrity

### 2. **Database Constraints** (2 tests)
- ✅ Uniqueness constraints enforced at database level
- ✅ Case-insensitive uniqueness checking

### 3. **Transaction Handling** (2 tests)
- ✅ Failed operations don't create partial data
- ✅ Rollbacks preserve original data

### 4. **ID Generation** (2 tests)
- ✅ Sequential ID auto-increment
- ✅ Deleted IDs not reused

### 5. **Timestamps** (3 tests)
- ✅ `created_at` automatically set on creation
- ✅ `updated_at` changes on updates
- ✅ `created_at` remains unchanged on updates

### 6. **Complete Workflows** (2 tests)
- ✅ Full project lifecycle (create → read → update → delete)
- ✅ Managing multiple projects simultaneously

### 7. **Error Recovery** (2 tests)
- ✅ Database remains consistent after validation errors
- ✅ 404 errors don't affect database state

**Total: 15 integration tests**

## 🚀 Running Integration Tests

### Run all integration tests:
```bash
cd backend
pytest integration_tests/
```

### Run with verbose output:
```bash
pytest integration_tests/ -v
```

### Run specific test file:
```bash
pytest integration_tests/test_projects_integration.py
```

### Run specific test class:
```bash
pytest integration_tests/test_projects_integration.py::TestDatabasePersistence
```

### Run specific test:
```bash
pytest integration_tests/test_projects_integration.py::TestDatabasePersistence::test_project_persists_across_sessions
```

### Run both unit and integration tests:
```bash
pytest unit_tests/ integration_tests/
```

### Run with coverage (both test suites):
```bash
pytest unit_tests/ integration_tests/ --cov=app --cov-report=term-missing
```

## 🗄️ Test Database

### Configuration
- **Database File:** `youtube_assistant_test.db`
- **Location:** `backend/integration_tests/`
- **Lifecycle:** Created before each test, deleted after

### Isolation Strategy
- Each test gets a fresh database file
- Database file is created in `conftest.py` fixture
- File is automatically deleted after test completes
- **Your app data is never touched!**

### Database Location
```
backend/
├── youtube_assistant.db          # Your app database (NOT touched by tests!)
└── integration_tests/
    └── youtube_assistant_test.db # Test database (auto-created/deleted)
```

## 🔧 Fixtures

### `db_engine`
Creates a SQLAlchemy engine connected to a real database file. Handles database creation and cleanup.

### `db_session`
Provides a database session for each test. Uses rollback for test isolation.

### `client`
FastAPI TestClient configured to use the test database.

### `sample_project_data`
Sample project dictionary for testing.

### `create_sample_project`
Factory fixture to create projects in the test database.

### `db_file_path`
Provides the path to the test database file for verification tests.

## 📊 Test Coverage Areas

### Database-Specific Behaviors
- ✅ File persistence
- ✅ Constraints enforcement
- ✅ Transaction management
- ✅ Auto-increment IDs
- ✅ Timestamp handling

### Workflow Testing
- ✅ Complete CRUD lifecycles
- ✅ Multi-project management
- ✅ Error recovery scenarios

## 🎓 Key Differences from Unit Tests

1. **Real Database File**
   - Integration tests use an actual SQLite file
   - Tests verify data actually persists to disk
   - Catches file I/O and permission issues

2. **Database Constraints**
   - Tests verify constraints work at database level
   - Not just application-level validation

3. **Transaction Behavior**
   - Tests verify rollbacks work correctly
   - Ensures failed operations don't corrupt data

4. **ID Management**
   - Tests verify auto-increment behavior
   - Ensures IDs aren't reused after deletion

## 🔄 When to Run

### During Development
Run integration tests when:
- Adding new database models
- Modifying database constraints
- Changing transaction logic
- Before committing database-related changes

### In CI/CD
Run both unit and integration tests:
```bash
pytest unit_tests/ integration_tests/ --cov=app
```

## ⚡ Performance

Integration tests are still fast because:
- SQLite is lightweight
- Database file is small
- Tests run sequentially
- Each test is isolated

**Typical execution time:** ~1-2 seconds for all 15 tests

## 🐛 Debugging

### View test database during debugging:
1. Add a breakpoint in the test
2. While paused, the database file exists at `integration_tests/youtube_assistant_test.db`
3. Use SQLite browser to inspect: `sqlite3 integration_tests/youtube_assistant_test.db`

### Keep database file after test (for debugging):
Comment out the cleanup in `conftest.py`:
```python
# TEST_DB_PATH.unlink()  # Comment this line
```

## 📝 Writing New Integration Tests

### Example Test Template
```python
class TestNewFeature:
    """Tests for new database feature."""
    
    def test_database_behavior(self, client, db_file_path):
        """Test that new feature works with real database."""
        # Create data
        response = client.post("/api/endpoint", json={...})
        
        # Verify persistence
        assert db_file_path.exists()
        
        # Verify behavior
        get_response = client.get("/api/endpoint")
        assert get_response.status_code == 200
```

### Best Practices
1. Test database-specific behavior (not already covered by unit tests)
2. Verify data persistence across operations
3. Test constraint enforcement
4. Include workflow tests for complex features
5. Use descriptive test names

## 🎯 What NOT to Test Here

Don't duplicate unit tests! Integration tests should focus on:
- ✅ Database persistence
- ✅ Constraints and transactions
- ✅ Multi-step workflows
- ❌ Basic CRUD operations (covered in unit tests)
- ❌ Validation logic (covered in unit tests)
- ❌ Error messages (covered in unit tests)

## 📚 Resources

- **Unit Tests:** `backend/unit_tests/` - Test logic in isolation
- **Database Models:** `backend/app/models.py` - SQLAlchemy models
- **Database Config:** `backend/app/database.py` - Database setup
- **API Endpoints:** `backend/app/main.py` - FastAPI routes

## 🎉 Summary

Integration tests provide confidence that:
- ✅ Data persists correctly to the database
- ✅ Database constraints work as expected
- ✅ Transactions maintain data integrity
- ✅ Your app will work with a real database file
- ✅ No interference with your actual app data

**Total Coverage: 15 integration tests + 25 unit tests = 40 tests total!**
