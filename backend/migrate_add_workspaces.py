"""
Migration script to add workspaces functionality.

This script:
1. Creates the workspaces table if it doesn't exist
2. Creates a default workspace (id=1, name="Default Workspace")
3. Adds workspace_id column to projects table if it doesn't exist
4. Updates all existing projects to workspace_id=1
5. Creates index on projects.workspace_id

Related: Issue #91 - Multi-Workspace Support

Usage:
    python migrate_add_workspaces.py
"""

import os
import sys
from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    create_engine,
    func,
    inspect,
)
from sqlalchemy.orm import Session, declarative_base

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./youtube_assistant.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
Base = declarative_base()


class Workspace(Base):
    """Workspace model for migration."""

    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )


class Project(Base):
    """Project model for migration."""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    status = Column(String(50), default="planned")
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        default=1,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    __table_args__ = (Index("uix_project_name_lower", func.lower(name), unique=True),)


def table_exists(inspector, table_name: str) -> bool:
    """Check if a table exists in the database."""
    return table_name in inspector.get_table_names()


def column_exists(inspector, table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns


def index_exists(inspector, table_name: str, index_name: str) -> bool:
    """Check if an index exists in a table."""
    indexes = inspector.get_indexes(table_name)
    return any(idx["name"] == index_name for idx in indexes)


def migrate():
    """Run the migration to add workspaces functionality."""
    inspector = inspect(engine)

    print("Starting migration: Adding workspaces functionality...")

    # Step 1: Create workspaces table if it doesn't exist
    if not table_exists(inspector, "workspaces"):
        print("Creating workspaces table...")
        Workspace.__table__.create(engine)
        print("✓ Workspaces table created")
    else:
        print("✓ Workspaces table already exists")

    # Step 2: Create default workspace
    with Session(engine) as session:
        default_workspace = session.query(Workspace).filter_by(id=1).first()
        if not default_workspace:
            print("Creating default workspace...")
            default_workspace = Workspace(
                id=1,
                name="Default Workspace",
                description="Your personal workspace for all projects",
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
            session.add(default_workspace)
            session.commit()
            print("✓ Default workspace created")
        else:
            print("✓ Default workspace already exists")

    # Step 3: Add workspace_id column to projects table if it doesn't exist
    if table_exists(inspector, "projects"):
        if not column_exists(inspector, "projects", "workspace_id"):
            print("Adding workspace_id column to projects table...")
            with engine.connect() as conn:
                # SQLite doesn't support ALTER TABLE ADD COLUMN with all constraints
                # so we add the column first, then create the index
                if DATABASE_URL.startswith("sqlite"):
                    conn.execute(
                        "ALTER TABLE projects ADD COLUMN workspace_id INTEGER DEFAULT 1"
                    )
                    conn.commit()
                else:
                    # PostgreSQL syntax
                    conn.execute(
                        "ALTER TABLE projects ADD COLUMN workspace_id INTEGER DEFAULT 1"
                    )
                    conn.execute(
                        "ALTER TABLE projects ADD CONSTRAINT fk_project_workspace "
                        "FOREIGN KEY (workspace_id) REFERENCES workspaces(id) "
                        "ON DELETE CASCADE"
                    )
                    conn.commit()
            print("✓ workspace_id column added to projects table")
        else:
            print("✓ workspace_id column already exists in projects table")

        # Step 4: Update existing projects to have workspace_id=1
        with Session(engine) as session:
            result = session.execute(
                "UPDATE projects SET workspace_id = 1 WHERE workspace_id IS NULL"
            )
            session.commit()
            if result.rowcount > 0:
                print(
                    f"✓ Updated {result.rowcount} existing projects to default "
                    "workspace"
                )
            else:
                print("✓ All projects already have workspace_id set")

        # Step 5: Create index on workspace_id if it doesn't exist
        if not index_exists(inspector, "projects", "ix_projects_workspace_id"):
            print("Creating index on projects.workspace_id...")
            with engine.connect() as conn:
                conn.execute(
                    "CREATE INDEX ix_projects_workspace_id "
                    "ON projects(workspace_id)"
                )
                conn.commit()
            print("✓ Index created on projects.workspace_id")
        else:
            print("✓ Index already exists on projects.workspace_id")
    else:
        print("⚠ Projects table doesn't exist yet - will be created by application")

    print("\n✓ Migration completed successfully!")


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        sys.exit(1)
