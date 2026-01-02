"""
Service layer for business logic separation from API endpoints.

This module provides reusable business logic for templates, projects, and workspaces,
following the separation of concerns principle and making code more testable
and maintainable.
"""

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import Template, Workspace
from .schemas import TemplateCreate, TemplateUpdate


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

    @staticmethod
    def create_template(
        template_data: TemplateCreate, workspace_id: int, db: Session
    ) -> Template:
        """Create a template scoped to a workspace with duplicate protection."""
        WorkspaceService.get_workspace_or_404(workspace_id, db)

        existing = TemplateService.check_duplicate_content(
            template_data.type, template_data.content, workspace_id, db
        )
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Template with this content already exists (ID: {existing.id})",
            )

        db_template = Template(
            type=template_data.type,
            name=template_data.name,
            content=template_data.content,
            workspace_id=workspace_id,
        )

        try:
            db.add(db_template)
            db.commit()
            db.refresh(db_template)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Template with this content already exists",
            ) from None

        return db_template

    @staticmethod
    def update_template(
        template_id: int,
        template_update: TemplateUpdate,
        workspace_id: int,
        db: Session,
    ) -> Template:
        """Update a template with optional type/content changes and deduping."""
        db_template = TemplateService.get_template_or_404(
            template_id, workspace_id, db
        )

        if template_update.type or template_update.content:
            existing = TemplateService.check_duplicate_content(
                template_update.type or db_template.type,  # type: ignore[arg-type]
                template_update.content or db_template.content,  # type: ignore[arg-type]
                workspace_id,
                db,
                exclude_id=template_id,
            )
            if existing:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Template with this content already exists "
                        f"(ID: {existing.id})"
                    ),
                )

        update_data = template_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_template, field, value)

        try:
            db.commit()
            db.refresh(db_template)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Template with this content already exists",
            ) from None

        return db_template

    @staticmethod
    def delete_template(template_id: int, workspace_id: int, db: Session) -> None:
        """Delete a template scoped to a workspace."""
        db_template = TemplateService.get_template_or_404(template_id, workspace_id, db)
        db.delete(db_template)
        db.commit()
