"""
Pydantic schemas for request/response validation.
Related: ADR-001 for project-based organization
Related: Issue #27 - Validation enhancements
Related: Issue #59 - Pydantic V2 ConfigDict migration
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProjectBase(BaseModel):
    """Base schema for project data"""

    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: str | None = Field(
        None, max_length=2000, description="Project description (max 2000 chars)"
    )
    status: str = Field(
        default="planned",
        description="Project status (planned, in_progress, completed, archived)",
    )


class ProjectCreate(ProjectBase):
    """
    Schema for creating a new project.

    Validation rules:
    - Name: Leading/trailing whitespace automatically trimmed
    - Description: Empty strings converted to null, max 2000 chars

    Related: Issue #27
    """

    @field_validator("name")
    @classmethod
    def trim_name(cls, v: str) -> str:
        """
        Trim leading and trailing whitespace from project name.

        This ensures consistent storage and prevents issues with duplicate detection.
        Applied before duplicate checking and database storage.

        Validates that name is not empty after trimming.

        Args:
            v: Project name string

        Returns:
            Trimmed project name

        Raises:
            ValueError: If name is empty after trimming

        Related: Issue #27, Decision #2
        """
        if v:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Project name cannot be empty or only whitespace")
            return trimmed
        return v

    @field_validator("description")
    @classmethod
    def empty_to_null(cls, v: str | None) -> str | None:
        """
        Convert empty description strings to null.

        Ensures consistent representation of "no description" in the database.
        Empty strings are normalized to None/null.

        Args:
            v: Description string or None

        Returns:
            None if empty string, otherwise the original value

        Related: Issue #27, Decision #16
        """
        if v == "":
            return None
        return v


class ProjectUpdate(BaseModel):
    """
    Schema for updating an existing project.

    Validation rules:
    - Name: Leading/trailing whitespace automatically trimmed (if provided)
    - Description: Empty strings converted to null, max 2000 chars

    Related: Issue #27
    """

    name: str | None = Field(
        None, min_length=1, max_length=255, description="Project name"
    )
    description: str | None = Field(
        None, max_length=2000, description="Project description (max 2000 chars)"
    )
    status: str | None = Field(None, description="Project status")

    @field_validator("name")
    @classmethod
    def trim_name(cls, v: str | None) -> str | None:
        """
        Trim leading and trailing whitespace from project name.

        Args:
            v: Project name string or None

        Returns:
            Trimmed project name or None

        Raises:
            ValueError: If name is empty after trimming

        Related: Issue #27, Decision #2
        """
        if v:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Project name cannot be empty or only whitespace")
            return trimmed
        return v

    @field_validator("description")
    @classmethod
    def empty_to_null(cls, v: str | None) -> str | None:
        """
        Convert empty description strings to null.

        Args:
            v: Description string or None

        Returns:
            None if empty string, otherwise the original value

        Related: Issue #27, Decision #16
        """
        if v == "":
            return None
        return v


class ProjectResponse(ProjectBase):
    """
    Schema for project response.

    Configuration:
    - from_attributes: Enables compatibility with SQLAlchemy ORM models

    Related: Issue #59 - Migrated from class Config to ConfigDict
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
