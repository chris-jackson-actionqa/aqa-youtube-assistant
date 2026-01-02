"""
Service layer for business logic separation from API endpoints.

This module provides reusable business logic for templates, projects, and workspaces,
following the separation of concerns principle and making code more testable
and maintainable.
"""

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import Template, Workspace


class WorkspaceService:
    """Service for workspace-related operations."""

    @staticmethod
    def get_workspace_or_404(workspace_id: int, db: Session) -> Workspace:
        """
        Retrieve a workspace by ID or raise 404.

        Args:
            workspace_id: The workspace ID
            db: Database session

        Returns:
            Workspace object

        Raises:
            HTTPException: 404 if workspace not found
        """
        workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            raise HTTPException(
                status_code=404,
                detail=f"Workspace with id {workspace_id} not found",
            )
        return workspace


class TemplateService:
    """Service for template-related operations."""

    @staticmethod
    def get_template_or_404(
        template_id: int, workspace_id: int, db: Session
    ) -> Template:
        """
        Retrieve a template by ID and workspace, or raise 404.

        Args:
            template_id: The template ID
            workspace_id: The workspace ID
            db: Database session

        Returns:
            Template object

        Raises:
            HTTPException: 404 if template not found in workspace
        """
        template = (
            db.query(Template)
            .filter(
                Template.id == template_id,
                Template.workspace_id == workspace_id,
            )
            .first()
        )
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template

    @staticmethod
    def check_duplicate_content(
        type_: str,
        content: str,
        workspace_id: int,
        db: Session,
        exclude_id: int | None = None,
    ) -> Template | None:
        """
        Check for duplicate template content in workspace (case-insensitive).

        Useful for both create and update operations to enforce uniqueness
        of (workspace_id, type, content) tuples.

        Args:
            type_: Template type
            content: Template content
            workspace_id: Workspace ID
            db: Database session
            exclude_id: Template ID to exclude from check (for updates)

        Returns:
            Existing template if duplicate found, None otherwise
        """
        query = db.query(Template).filter(
            Template.workspace_id == workspace_id,
            Template.type == type_,
            func.lower(Template.content) == func.lower(content),
        )

        if exclude_id is not None:
            query = query.filter(Template.id != exclude_id)

        return query.first()

    @staticmethod
    def get_templates(
        workspace_id: int, db: Session, type_filter: str | None = None
    ) -> list[Template]:
        """
        Get all templates in workspace, optionally filtered by type.

        Args:
            workspace_id: Workspace ID
            db: Database session
            type_filter: Optional template type filter

        Returns:
            List of Template objects
        """
        query = db.query(Template).filter(Template.workspace_id == workspace_id)

        if type_filter:
            query = query.filter(Template.type == type_filter)

        return query.order_by(Template.created_at.desc()).all()
