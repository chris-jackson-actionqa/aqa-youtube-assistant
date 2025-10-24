"""
Database models for YouTube Assistant.

Related: ADR-001 for project-based organization
Related: Issue #27 - Database constraints
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from .database import Base


class Project(Base):
    """
    Project database model.
    
    Represents a YouTube video project with unique name constraint.
    Note: SQLite does not enforce case-insensitive uniqueness at DB level.
    Case-insensitive duplicate checking handled at application level.
    
    Attributes:
        id: Primary key
        name: Project name (unique, case-sensitive at DB level)
        description: Optional project description (max 2000 chars)
        status: Project status (planned, in_progress, completed, archived)
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
        
    Related: Issue #27, Decision #4
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text)
    status = Column(String(50), default="planned")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)