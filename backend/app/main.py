import logging
import os
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

# Load environment variables from .env file at module import time
# CRITICAL: Must be called before importing local modules that use os.getenv()
load_dotenv()

from .database import get_db  # noqa: E402
from .migrations import run_migrations  # noqa: E402
from .models import Project, Workspace  # noqa: E402
from .schemas import (  # noqa: E402
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceUpdate,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.

    Runs migrations on startup and handles cleanup on shutdown.
    """
    # Configure logging at startup (not at module level)
    # This avoids interfering with test framework logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("🚀 Starting application...")

    try:
        # Run database migrations on startup
        run_migrations()
    except Exception as e:
        logger.error(f"Failed to run migrations: {e}")
        raise

    yield

    # Cleanup code would go here if needed
    logger.info("👋 Shutting down application...")


app = FastAPI(
    title="YouTube Assistant API",
    description="Backend API for YouTube video planning assistant",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS to allow the Next.js frontend to communicate with the backend
# Reads allowed origins from CORS_ORIGINS environment variable
# Defaults to localhost:3000 (dev) if not set
# Production should set CORS_ORIGINS=http://localhost:3001
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [
    origin.strip() for origin in cors_origins_str.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency Functions


async def get_workspace_id(
    x_workspace_id: int | None = Header(default=1, alias="X-Workspace-Id")
) -> int:
    """
    Extract workspace ID from X-Workspace-Id header.

    Defaults to workspace_id=1 (default workspace) if header is missing or null.
    Used by project endpoints to filter projects by workspace.

    Args:
        x_workspace_id: Workspace ID from header (optional, defaults to 1)

    Returns:
        int: Workspace ID (never None, always >= 1)

    Related: Issue #92
    """
    return x_workspace_id or 1


# API Endpoints


@app.get("/")
async def root():
    """Root endpoint returning API information"""
    return {"message": "YouTube Assistant API", "version": "1.0.0", "status": "running"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# CRUD Operations for Workspaces


@app.post("/api/workspaces", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(workspace: WorkspaceCreate, db: Session = Depends(get_db)):
    """
    Create a new workspace.

    Validation:
    - Workspace name is automatically trimmed of leading/trailing whitespace
    - Empty descriptions are converted to null
    - Duplicate names rejected (unique constraint)

    Args:
        workspace: Workspace data (name, description)
        db: Database session

    Returns:
        WorkspaceResponse: Created workspace object with project_count=0

    Raises:
        HTTPException: 400 if workspace with same name already exists

    Related: Issue #92
    """
    # Check for duplicate workspace names
    existing_workspace = (
        db.query(Workspace).filter(Workspace.name == workspace.name).first()
    )
    if existing_workspace:
        raise HTTPException(
            status_code=400,
            detail=f"A workspace named '{workspace.name}' already exists",
        )

    db_workspace = Workspace(name=workspace.name, description=workspace.description)

    try:
        db.add(db_workspace)
        db.commit()
        db.refresh(db_workspace)
        # Manually construct response with project_count
        return {
            "id": db_workspace.id,
            "name": db_workspace.name,
            "description": db_workspace.description,
            "created_at": db_workspace.created_at,
            "updated_at": db_workspace.updated_at,
            "project_count": 0,
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"A workspace named '{workspace.name}' already exists",
        ) from None


@app.get("/api/workspaces", response_model=list[WorkspaceResponse])
async def get_workspaces(db: Session = Depends(get_db)):
    """
    Get list of all workspaces, ordered by creation date (newest first).

    Each workspace includes a count of associated projects.

    Args:
        db: Database session

    Returns:
        List[WorkspaceResponse]: List of all workspaces with project counts

    Related: Issue #92
    """
    workspaces = db.query(Workspace).order_by(Workspace.created_at.desc()).all()

    # Build response with project counts
    response = []
    for workspace in workspaces:
        project_count = (
            db.query(Project).filter(Project.workspace_id == workspace.id).count()
        )
        # Manually construct response dict with project_count
        response.append(
            {
                "id": workspace.id,
                "name": workspace.name,
                "description": workspace.description,
                "created_at": workspace.created_at,
                "updated_at": workspace.updated_at,
                "project_count": project_count,
            }
        )

    return response


@app.get("/api/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(workspace_id: int, db: Session = Depends(get_db)):
    """
    Get a specific workspace by ID.

    Includes count of associated projects.

    Args:
        workspace_id: Workspace ID
        db: Database session

    Returns:
        WorkspaceResponse: Workspace object with project count

    Raises:
        HTTPException: 404 if workspace not found

    Related: Issue #92
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if workspace is None:
        raise HTTPException(
            status_code=404, detail=f"Workspace with id {workspace_id} not found"
        )

    # Count associated projects
    project_count = (
        db.query(Project).filter(Project.workspace_id == workspace_id).count()
    )

    # Manually construct response dict with project_count
    return {
        "id": workspace.id,
        "name": workspace.name,
        "description": workspace.description,
        "created_at": workspace.created_at,
        "updated_at": workspace.updated_at,
        "project_count": project_count,
    }


@app.put("/api/workspaces/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: int, workspace_update: WorkspaceUpdate, db: Session = Depends(get_db)
):
    """
    Update an existing workspace.

    Validation:
    - Default workspace (id=1) cannot be renamed
    - Workspace name is automatically trimmed of leading/trailing whitespace
      (if provided)
    - Empty descriptions are converted to null
    - Duplicate names rejected (unique constraint)

    Args:
        workspace_id: Workspace ID
        workspace_update: Updated workspace data
        db: Database session

    Returns:
        WorkspaceResponse: Updated workspace object with project count

    Raises:
        HTTPException: 404 if workspace not found
        HTTPException: 403 if trying to rename default workspace (id=1)
        HTTPException: 400 if updating to a name that already exists

    Related: Issue #92
    """
    db_workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if db_workspace is None:
        raise HTTPException(
            status_code=404, detail=f"Workspace with id {workspace_id} not found"
        )

    # Update only provided fields
    update_data = workspace_update.model_dump(exclude_unset=True)

    # Protect default workspace from being renamed
    if workspace_id == 1 and "name" in update_data:
        raise HTTPException(
            status_code=403, detail="Cannot rename the default workspace"
        )

    # If name is being updated, check for duplicates (excluding current workspace)
    if "name" in update_data:
        existing_workspace = (
            db.query(Workspace)
            .filter(Workspace.name == update_data["name"], Workspace.id != workspace_id)
            .first()
        )
        if existing_workspace:
            raise HTTPException(
                status_code=400,
                detail=f"A workspace named '{update_data['name']}' already exists",
            )

    for field, value in update_data.items():
        setattr(db_workspace, field, value)

    db_workspace.updated_at = datetime.now(UTC)  # type: ignore[assignment]

    try:
        db.commit()
        db.refresh(db_workspace)

        # Count associated projects for response
        project_count = (
            db.query(Project).filter(Project.workspace_id == workspace_id).count()
        )

        # Manually construct response dict with project_count
        return {
            "id": db_workspace.id,
            "name": db_workspace.name,
            "description": db_workspace.description,
            "created_at": db_workspace.created_at,
            "updated_at": db_workspace.updated_at,
            "project_count": project_count,
        }
    except IntegrityError:
        db.rollback()
        workspace_name = update_data.get("name", "unknown")
        raise HTTPException(
            status_code=400,
            detail=f"A workspace named '{workspace_name}' already exists",
        ) from None


@app.delete("/api/workspaces/{workspace_id}", status_code=204)
async def delete_workspace(workspace_id: int, db: Session = Depends(get_db)):
    """
    Delete a workspace.

    Business rules:
    - Default workspace (id=1) cannot be deleted
    - Workspaces with existing projects cannot be deleted

    Args:
        workspace_id: Workspace ID
        db: Database session

    Returns:
        None (204 No Content)

    Raises:
        HTTPException: 404 if workspace not found
        HTTPException: 403 if trying to delete default workspace (id=1)
        HTTPException: 400 if workspace has projects

    Related: Issue #92
    """
    db_workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if db_workspace is None:
        raise HTTPException(
            status_code=404, detail=f"Workspace with id {workspace_id} not found"
        )

    # Protect default workspace from deletion
    if workspace_id == 1:
        raise HTTPException(
            status_code=403, detail="Cannot delete the default workspace"
        )

    # Check if workspace has projects
    project_count = (
        db.query(Project).filter(Project.workspace_id == workspace_id).count()
    )
    if project_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot delete workspace with {project_count} project(s). "
                "Move or delete projects first."
            ),
        )

    db.delete(db_workspace)
    db.commit()
    return None


# CRUD Operations for Projects


@app.post("/api/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    workspace_id: int = Depends(get_workspace_id),
):
    """
    Create a new video project in a specific workspace.

    The workspace is determined by the X-Workspace-Id header.
    Defaults to workspace_id=1 (default workspace) if header is missing.

    Validation:
    - Project name is automatically trimmed of leading/trailing whitespace
    - Empty descriptions are converted to null
    - Duplicate names rejected (case-insensitive)
    - Database-level unique constraint enforced
    - Workspace must exist

    Args:
        project: Project data (name, description, status)
        db: Database session
        workspace_id: Workspace ID from X-Workspace-Id header (default: 1)

    Returns:
        ProjectResponse: Created project object

    Raises:
        HTTPException: 409 if project with same name already exists
        HTTPException: 404 if workspace doesn't exist

    Related: Issue #27, Issue #30, Issue #92, Issue #118
    """
    # Validate workspace exists
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if workspace is None:
        raise HTTPException(
            status_code=404, detail=f"Workspace with id {workspace_id} not found"
        )

    # Check for duplicate names within the same workspace (case-insensitive)
    # Using ilike() for case-insensitive comparison handles different capitalization
    # Note: Name has already been trimmed by Pydantic validator
    # Projects with the same name are allowed in different workspaces
    existing_project = (
        db.query(Project)
        .filter(Project.name.ilike(project.name))
        .filter(Project.workspace_id == workspace_id)
        .first()
    )
    if existing_project:
        raise HTTPException(
            status_code=409, detail=f"A project named '{project.name}' already exists"
        )

    db_project = Project(
        name=project.name,
        description=project.description,
        status=project.status,
        video_title=project.video_title,
        workspace_id=workspace_id,
    )

    try:
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project
    except IntegrityError:
        db.rollback()
        # Handle database-level unique constraint violation
        # This is a fallback in case application-level check was bypassed
        # (e.g., race condition)
        # Suppress exception chain to hide SQLAlchemy internals from API response
        raise HTTPException(
            status_code=409,
            detail=f"A project named '{project.name}' already exists",
        ) from None


@app.get("/api/projects", response_model=list[ProjectResponse])
async def get_projects(
    db: Session = Depends(get_db), workspace_id: int = Depends(get_workspace_id)
):
    """
    Get list of video projects in a specific workspace.

    The workspace is determined by the X-Workspace-Id header.
    Defaults to workspace_id=1 (default workspace) if header is missing.
    Projects are ordered by creation date (newest first).

    Args:
        db: Database session
        workspace_id: Workspace ID from X-Workspace-Id header (default: 1)

    Returns:
        List[ProjectResponse]: List of projects in the workspace

    Related: Issue #92
    """
    projects = (
        db.query(Project)
        .filter(Project.workspace_id == workspace_id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return projects


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    workspace_id: int = Depends(get_workspace_id),
):
    """
    Get a specific video project by ID.

    The workspace is determined by the X-Workspace-Id header.
    Returns 404 if project exists but belongs to a different workspace.

    Args:
        project_id: Project ID
        db: Database session
        workspace_id: Workspace ID from X-Workspace-Id header (default: 1)

    Returns:
        ProjectResponse: Project object

    Raises:
        HTTPException: 404 if project not found or belongs to different workspace

    Related: Issue #92
    """
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.workspace_id == workspace_id)
        .first()
    )
    if project is None:
        raise HTTPException(
            status_code=404, detail=f"Project with id {project_id} not found"
        )
    return project


@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    workspace_id: int = Depends(get_workspace_id),
):
    """
    Update an existing video project.

    The workspace is determined by the X-Workspace-Id header.
    Returns 404 if project exists but belongs to a different workspace.

    Validation:
    - Project name is automatically trimmed of leading/trailing whitespace
      (if provided)
    - Empty descriptions are converted to null
    - Duplicate names rejected (case-insensitive)
    - Database-level unique constraint enforced

    Args:
        project_id: Project ID
        project_update: Updated project data
        db: Database session
        workspace_id: Workspace ID from X-Workspace-Id header (default: 1)

    Returns:
        ProjectResponse: Updated project object

    Raises:
        HTTPException: 404 if project not found or belongs to different workspace
        HTTPException: 409 if updating to a name that already exists

    Related: Issue #27, Issue #30, Issue #92, Issue #118
    """
    db_project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.workspace_id == workspace_id)
        .first()
    )
    if db_project is None:
        raise HTTPException(
            status_code=404, detail=f"Project with id {project_id} not found"
        )

    # Update only provided fields
    update_data = project_update.model_dump(exclude_unset=True)

    # If name is being updated, check for duplicates within the same workspace
    # (excluding current project)
    # Note: Name has already been trimmed by Pydantic validator
    # Projects with the same name are allowed in different workspaces
    if "name" in update_data:
        existing_project = (
            db.query(Project)
            .filter(Project.name.ilike(update_data["name"]), Project.id != project_id)
            .filter(Project.workspace_id == workspace_id)
            .first()
        )
        if existing_project:
            raise HTTPException(
                status_code=409,
                detail=f"A project named '{update_data['name']}' already exists",
            )

    for field, value in update_data.items():
        setattr(db_project, field, value)

    # SQLAlchemy Column type annotations don't match runtime assignment behavior
    db_project.updated_at = datetime.now(UTC)  # type: ignore[assignment]

    try:
        db.commit()
        db.refresh(db_project)
        return db_project
    except IntegrityError:
        db.rollback()
        # Handle database-level unique constraint violation
        # This is a fallback in case application-level check was bypassed
        project_name = update_data.get("name", "unknown")
        # Suppress exception chain to hide SQLAlchemy internals from API response
        raise HTTPException(
            status_code=409,
            detail=f"A project named '{project_name}' already exists",
        ) from None


@app.delete("/api/projects/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    workspace_id: int = Depends(get_workspace_id),
):
    """
    Delete a video project.

    The workspace is determined by the X-Workspace-Id header.
    Returns 404 if project exists but belongs to a different workspace.

    Args:
        project_id: Project ID
        db: Database session
        workspace_id: Workspace ID from X-Workspace-Id header (default: 1)

    Returns:
        None (204 No Content)

    Raises:
        HTTPException: 404 if project not found or belongs to different workspace

    Related: Issue #92
    """
    db_project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.workspace_id == workspace_id)
        .first()
    )
    if db_project is None:
        raise HTTPException(
            status_code=404, detail=f"Project with id {project_id} not found"
        )

    db.delete(db_project)
    db.commit()
    return None
