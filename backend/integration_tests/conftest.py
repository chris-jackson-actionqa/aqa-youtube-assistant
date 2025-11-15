"""
Pytest configuration and fixtures for integration tests.

This module provides fixtures for testing with a real SQLite database file.
Unlike unit tests which use in-memory databases, these tests verify
database persistence, constraints, and real-world database behavior.
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import Project

# Test database configuration
TEST_DB_NAME = "youtube_assistant_test.db"
TEST_DB_PATH = Path(__file__).parent / TEST_DB_NAME
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"


@pytest.fixture(scope="function")
def db_engine():
    """
    Create a database engine for testing with a real SQLite file.

    This fixture creates the database file before tests and removes it after.
    """
    # Create engine with real database file
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})

    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield engine

    # Cleanup: Drop all tables and remove database file
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

    # Remove the test database file
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture(scope="function")
def db_session(db_engine):
    """
    Create a database session for each test.

    This fixture provides a fresh database session that is rolled back
    after each test to maintain test isolation.
    """
    from app.models import Workspace

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = SessionLocal()

    # Create default workspace (id=1) to match application behavior
    default_workspace = Workspace(
        id=1,
        name="Default Workspace",
        description="Default workspace for testing",
    )
    session.add(default_workspace)
    session.commit()

    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a TestClient with overridden database dependency.

    This fixture provides a test client that uses the real test database
    instead of the application's database.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_project_data():
    """Sample project data for testing."""
    return {
        "name": "Integration Test Project",
        "description": "Testing with real database",
        "status": "planned",
    }


@pytest.fixture
def create_sample_project(db_session):
    """
    Factory fixture to create sample projects in the test database.

    Returns a function that creates projects with given data.
    """

    def _create_project(**kwargs):
        project_data = {
            "name": "Sample Project",
            "description": "Sample description",
            "status": "planned",
            "workspace_id": 1,  # Default workspace
        }
        project_data.update(kwargs)

        project = Project(**project_data)
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)
        return project

    return _create_project


@pytest.fixture
def db_file_path():
    """Provides the path to the test database file for verification."""
    return TEST_DB_PATH


@pytest.fixture
def create_sample_template(client):
    """
    Factory fixture to create sample templates for testing.

    Returns a function that creates templates with given data.
    """

    def _create(
        type="title",
        name="Test Template",
        content="Best {{tools}} for Testers in 2025",
    ):
        response = client.post(
            "/api/templates",
            json={"type": type, "name": name, "content": content},
        )
        return response.json()

    return _create
