"""
Integration tests for migrate_add_workspaces.py migration script.

Tests migration script on:
- Empty database (no tables)
- Clean database (tables exist but no data)
- Database with existing projects
- Idempotency (running migration multiple times)

Related: Issue #91 - Multi-Workspace Support
"""

import os
import sys
import tempfile
from pathlib import Path

import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session

# Add backend directory to path for importing migration script
# (Must be before app imports to avoid import errors)
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(backend_dir / "app"))

from app.models import Project, Workspace  # noqa: E402


class TestMigrationOnEmptyDatabase:
    """Tests for running migration on an empty database."""

    @pytest.fixture
    def empty_db_path(self):
        """Create a temporary database file path."""
        with tempfile.NamedTemporaryFile(
            suffix=".db", delete=False
        ) as temp_file:
            db_path = temp_file.name
        yield db_path
        # Cleanup
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_migration_creates_tables(self, empty_db_path):
        """Test that migration creates workspaces table on empty database."""
        # Set environment variable for test database
        os.environ["DATABASE_URL"] = f"sqlite:///{empty_db_path}"

        # Import and run migration
        import migrate_add_workspaces

        migrate_add_workspaces.migrate()

        # Verify tables were created
        engine = create_engine(f"sqlite:///{empty_db_path}")
        inspector = inspect(engine)

        tables = inspector.get_table_names()
        assert "workspaces" in tables

    def test_migration_creates_default_workspace(self, empty_db_path):
        """Test that migration creates default workspace."""
        os.environ["DATABASE_URL"] = f"sqlite:///{empty_db_path}"

        import migrate_add_workspaces

        migrate_add_workspaces.migrate()

        # Verify default workspace exists
        engine = create_engine(f"sqlite:///{empty_db_path}")
        with Session(engine) as session:
            default_workspace = (
                session.query(Workspace).filter_by(id=1).first()
            )
            assert default_workspace is not None
            assert default_workspace.name == "Default Workspace"
            assert (
                default_workspace.description
                == "Your personal workspace for all projects"
            )


class TestMigrationOnDatabaseWithProjects:
    """Tests for running migration on database with existing projects."""

    @pytest.fixture
    def db_with_projects(self):
        """Create a database with existing projects table and data."""
        with tempfile.NamedTemporaryFile(
            suffix=".db", delete=False
        ) as temp_file:
            db_path = temp_file.name

        engine = create_engine(f"sqlite:///{db_path}")

        # Create old schema (without workspaces)
        from sqlalchemy import Column, DateTime, Index, Integer, String, Text, func
        from sqlalchemy.orm import declarative_base

        Base = declarative_base()

        class OldProject(Base):
            """Project model before workspace support."""

            __tablename__ = "projects"
            id = Column(Integer, primary_key=True, index=True)
            name = Column(String(255), nullable=False, index=True)
            description = Column(Text)
            status = Column(String(50), default="planned")
            created_at = Column(DateTime)
            updated_at = Column(DateTime)
            __table_args__ = (
                Index("uix_project_name_lower", func.lower(name), unique=True),
            )

        Base.metadata.create_all(engine)

        # Add some test projects
        with Session(engine) as session:
            projects = [
                OldProject(name="Project 1", status="planned"),
                OldProject(name="Project 2", status="in_progress"),
                OldProject(name="Project 3", status="completed"),
            ]
            session.add_all(projects)
            session.commit()

        yield db_path

        # Cleanup
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_migration_preserves_existing_projects(self, db_with_projects):
        """Test that migration preserves all existing projects."""
        os.environ["DATABASE_URL"] = f"sqlite:///{db_with_projects}"

        import migrate_add_workspaces

        migrate_add_workspaces.migrate()

        # Verify projects still exist
        engine = create_engine(f"sqlite:///{db_with_projects}")
        with Session(engine) as session:
            projects = session.query(Project).all()
            assert len(projects) == 3

            project_names = {p.name for p in projects}
            assert "Project 1" in project_names
            assert "Project 2" in project_names
            assert "Project 3" in project_names

    def test_migration_assigns_default_workspace_to_projects(
        self, db_with_projects
    ):
        """Test that migration assigns workspace_id=1 to existing projects."""
        os.environ["DATABASE_URL"] = f"sqlite:///{db_with_projects}"

        import migrate_add_workspaces

        migrate_add_workspaces.migrate()

        # Verify all projects have workspace_id=1
        engine = create_engine(f"sqlite:///{db_with_projects}")
        with Session(engine) as session:
            projects = session.query(Project).all()
            for project in projects:
                assert project.workspace_id == 1

    def test_migration_creates_workspace_id_index(self, db_with_projects):
        """Test that migration creates index on workspace_id."""
        os.environ["DATABASE_URL"] = f"sqlite:///{db_with_projects}"

        import migrate_add_workspaces

        migrate_add_workspaces.migrate()

        # Verify index exists
        engine = create_engine(f"sqlite:///{db_with_projects}")
        inspector = inspect(engine)

        indexes = inspector.get_indexes("projects")
        index_names = [idx["name"] for idx in indexes]
        assert "ix_projects_workspace_id" in index_names


class TestMigrationIdempotency:
    """Tests for running migration multiple times (idempotency)."""

    @pytest.fixture
    def db_path(self):
        """Create a temporary database file path."""
        with tempfile.NamedTemporaryFile(
            suffix=".db", delete=False
        ) as temp_file:
            db_path = temp_file.name
        yield db_path
        # Cleanup
        if os.path.exists(db_path):
            os.unlink(db_path)

    def test_migration_is_idempotent(self, db_path):
        """Test that running migration twice doesn't cause errors."""
        os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

        import migrate_add_workspaces

        # Run migration first time
        migrate_add_workspaces.migrate()

        # Run migration second time - should not raise errors
        migrate_add_workspaces.migrate()

        # Verify only one default workspace exists
        engine = create_engine(f"sqlite:///{db_path}")
        with Session(engine) as session:
            workspaces = session.query(Workspace).all()
            assert len(workspaces) == 1
            assert workspaces[0].id == 1

    def test_migration_with_existing_workspaces(self, db_path):
        """Test migration when workspaces table already exists."""
        os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

        import migrate_add_workspaces

        # Run migration first time
        migrate_add_workspaces.migrate()

        # Add more workspaces
        engine = create_engine(f"sqlite:///{db_path}")
        with Session(engine) as session:
            workspace = Workspace(name="User Workspace")
            session.add(workspace)
            session.commit()

        # Run migration again
        migrate_add_workspaces.migrate()

        # Verify both workspaces still exist
        with Session(engine) as session:
            workspaces = session.query(Workspace).all()
            assert len(workspaces) == 2

    def test_migration_with_projects_already_assigned(self, db_path):
        """Test migration when projects already have workspace_id."""
        os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

        import migrate_add_workspaces

        # Run migration first time
        migrate_add_workspaces.migrate()

        # Create projects table with workspace_id and add projects
        engine = create_engine(f"sqlite:///{db_path}")
        # Use the Project model to create the table schema
        Project.__table__.create(engine)

        with Session(engine) as session:
            projects = [
                Project(name="Project A", workspace_id=1),
                Project(name="Project B", workspace_id=1),
            ]
            session.add_all(projects)
            session.commit()

        # Run migration again
        migrate_add_workspaces.migrate()

        # Verify projects still have workspace_id=1
        with Session(engine) as session:
            projects = session.query(Project).all()
            assert len(projects) == 2
            for project in projects:
                assert project.workspace_id == 1


class TestMigrationHelperFunctions:
    """Tests for migration helper functions."""

    @pytest.fixture
    def test_db(self):
        """Create a test database."""
        with tempfile.NamedTemporaryFile(
            suffix=".db", delete=False
        ) as temp_file:
            db_path = temp_file.name

        engine = create_engine(f"sqlite:///{db_path}")
        yield engine

        # Cleanup
        if os.path.exists(db_path.replace("sqlite:///", "")):
            os.unlink(db_path.replace("sqlite:///", ""))

    def test_table_exists_function(self, test_db):
        """Test table_exists helper function."""
        from sqlalchemy import Column, Integer, MetaData, String, Table

        import migrate_add_workspaces

        inspector = inspect(test_db)

        # Test on non-existent table
        assert not migrate_add_workspaces.table_exists(
            inspector, "nonexistent"
        )

        # Create a table
        metadata = MetaData()
        Table(
            "test_table",
            metadata,
            Column("id", Integer, primary_key=True),
            Column("name", String(50)),
        )
        metadata.create_all(test_db)

        # Test on existing table
        inspector = inspect(test_db)  # Refresh inspector
        assert migrate_add_workspaces.table_exists(inspector, "test_table")

    def test_column_exists_function(self, test_db):
        """Test column_exists helper function."""
        from sqlalchemy import Column, Integer, MetaData, String, Table

        import migrate_add_workspaces

        # Create a table
        metadata = MetaData()
        Table(
            "test_table",
            metadata,
            Column("id", Integer, primary_key=True),
            Column("name", String(50)),
        )
        metadata.create_all(test_db)

        inspector = inspect(test_db)

        # Test existing column
        assert migrate_add_workspaces.column_exists(
            inspector, "test_table", "id"
        )
        assert migrate_add_workspaces.column_exists(
            inspector, "test_table", "name"
        )

        # Test non-existent column
        assert not migrate_add_workspaces.column_exists(
            inspector, "test_table", "nonexistent"
        )

    def test_index_exists_function(self, test_db):
        """Test index_exists helper function."""
        from sqlalchemy import Column, Index, Integer, MetaData, String, Table

        import migrate_add_workspaces

        # Create a table with an index
        metadata = MetaData()
        test_table = Table(
            "test_table",
            metadata,
            Column("id", Integer, primary_key=True),
            Column("name", String(50)),
        )
        # Create index
        Index("ix_test_name", test_table.c.name)
        metadata.create_all(test_db)

        inspector = inspect(test_db)

        # Test existing index
        assert migrate_add_workspaces.index_exists(
            inspector, "test_table", "ix_test_name"
        )

        # Test non-existent index
        assert not migrate_add_workspaces.index_exists(
            inspector, "test_table", "nonexistent"
        )
