"""
Pytest configuration and fixtures for unit tests.

This module provides shared fixtures for testing the FastAPI application.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Project

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for each test.

    This fixture creates all tables before the test and drops them after,
    ensuring test isolation.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a TestClient with overridden database dependency.

    This fixture provides a test client that uses the in-memory database
    instead of the actual database.
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
        "name": "Introduction to Test Automation",
        "description": "A comprehensive guide to getting started with test automation",
        "status": "planned",
    }


@pytest.fixture
def create_sample_project(db_session):
    """
    Factory fixture to create sample projects in the database.

    Returns a function that creates projects with given data.
    """

    def _create_project(**kwargs):
        project_data = {
            "name": "Sample Project",
            "description": "Sample description",
            "status": "planned",
        }
        project_data.update(kwargs)

        project = Project(**project_data)
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)
        return project

    return _create_project
