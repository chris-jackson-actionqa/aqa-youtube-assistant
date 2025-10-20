"""
Pydantic schemas for request/response validation.
Related: ADR-001 for project-based organization
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ProjectBase(BaseModel):
    """Base schema for project data"""
    title: str = Field(..., min_length=1, max_length=255, description="Project title")
    description: Optional[str] = Field(None, description="Project description")
    status: str = Field(default="planned", description="Project status (planned, in_progress, completed, archived)")


class ProjectCreate(ProjectBase):
    """Schema for creating a new project"""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project"""
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Project title")
    description: Optional[str] = Field(None, description="Project description")
    status: Optional[str] = Field(None, description="Project status")


class ProjectResponse(ProjectBase):
    """Schema for project response"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enables compatibility with SQLAlchemy models
