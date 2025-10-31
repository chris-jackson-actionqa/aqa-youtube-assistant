"""
Unit tests for database module.

Tests database configuration and session management.

Related: Issue #92
"""

from app.database import Base, SessionLocal, engine, get_db


class TestDatabaseConfiguration:
    """Tests for database configuration."""

    def test_engine_exists(self):
        """Test that database engine is created."""
        assert engine is not None

    def test_session_local_exists(self):
        """Test that SessionLocal is configured."""
        assert SessionLocal is not None

    def test_base_exists(self):
        """Test that declarative base is created."""
        assert Base is not None

    def test_get_db_generator(self):
        """Test that get_db returns a generator."""
        db_gen = get_db()
        # Get database session from generator
        db = next(db_gen)
        assert db is not None

        # Clean up - close the session
        try:
            next(db_gen)
        except StopIteration:
            pass  # Expected - generator should close after yielding
