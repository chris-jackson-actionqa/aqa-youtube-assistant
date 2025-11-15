"""
Database models for YouTube Assistant.

Related: ADR-001 for project-based organization
Related: Issue #27 - Database constraints
Related: Issue #30 - Case-insensitive UNIQUE constraint
Related: Issue #91 - Multi-Workspace Support
"""

from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import relationship

from .database import Base


class Workspace(Base):
    """
    Workspace database model.

    Represents a workspace for organizing projects. Each workspace can contain
    multiple projects, providing isolation and organization capabilities.

    Attributes:
        id: Primary key
        name: Workspace name (unique, max 100 chars)
        description: Optional workspace description (max 500 chars)
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
        projects: Relationship to associated projects (one-to-many)

    Related: Issue #91 - Multi-Workspace Support
    """

    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    # One-to-many relationship with projects
    projects = relationship(
        "Project", back_populates="workspace", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<Workspace(id={self.id}, name='{self.name}')>"


class Project(Base):
    """
    Project database model.

    Represents a YouTube video project with unique name constraint.
    The name field has a case-insensitive unique constraint enforced at
    the database level using a functional index on LOWER(name).

    Attributes:
        id: Primary key
        name: Project name (unique, case-insensitive)
        description: Optional project description (max 2000 chars)
        status: Project status (planned, in_progress, completed, archived)
        video_title: YouTube video title (optional, max 500 chars)
        workspace_id: Foreign key to workspace (nullable, default=1)
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
        workspace: Relationship to parent workspace

    Related: Issue #27, Issue #30, Issue #91, Issue #159, Decision #4
    """

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    status = Column(String(50), default="planned")
    video_title = Column(String(500), nullable=True)
    # Workspace foreign key with default=1 references "Default Workspace"
    # The migration script ensures workspace id=1 always exists
    # Future enhancement: Add DB constraint to prevent deletion of workspace id=1
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

    # Many-to-one relationship with workspace
    workspace = relationship("Workspace", back_populates="projects")

    # Case-insensitive unique constraint using functional index
    # This works across SQLite (dev) and PostgreSQL (future production)
    __table_args__ = (Index("uix_project_name_lower", func.lower(name), unique=True),)


class Template(Base):
    """
    Template database model.

    Represents a reusable template with placeholders for various content types
    (e.g., video titles, descriptions). Templates are global and not workspace-specific.

    Attributes:
        id: Primary key
        type: Template category ('title', 'description', etc.)
        name: User-friendly template label (max 100 chars)
        content: Template text with {{placeholders}} (max 256 chars)
        created_at: Timestamp of creation
        updated_at: Timestamp of last update

    Related: Epic #166 - Title Template Management
    """

    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    content = Column(String(256), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    # Case-insensitive unique constraint on (type, content)
    __table_args__ = (
        Index(
            "uix_template_type_content_lower",
            type,
            func.lower(content),
            unique=True,
        ),
    )

    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<Template(id={self.id}, type='{self.type}', name='{self.name}')>"

