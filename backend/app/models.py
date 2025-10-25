"""
Database models for YouTube Assistant.

Related: ADR-001 for project-based organization
Related: Issue #27 - Database constraints
Related: Issue #30 - Case-insensitive UNIQUE constraint
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Index, func
from datetime import datetime
from .database import Base


class Project(Base):
    """
    Project database model.
    
    Represents a YouTube video project with unique name constraint.
    The name field has a case-insensitive unique constraint enforced at the database level
    using a functional index on LOWER(name).
    
    Attributes:
        id: Primary key
        name: Project name (unique, case-insensitive)
        description: Optional project description (max 2000 chars)
        status: Project status (planned, in_progress, completed, archived)
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
        
    Related: Issue #27, Issue #30, Decision #4
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    status = Column(String(50), default="planned")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Case-insensitive unique constraint using functional index
    # This works across SQLite (dev) and PostgreSQL (future production)
    __table_args__ = (
        Index('uix_project_name_lower', func.lower(name), unique=True),
    )