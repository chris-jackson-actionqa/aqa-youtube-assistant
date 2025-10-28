from datetime import UTC, datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import engine, get_db
from .models import Base, Project
from .schemas import ProjectCreate, ProjectResponse, ProjectUpdate

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="YouTube Assistant API",
    description="Backend API for YouTube video planning assistant",
    version="1.0.0",
)

# Configure CORS to allow the Next.js frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint returning API information"""
    return {"message": "YouTube Assistant API", "version": "1.0.0", "status": "running"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# CRUD Operations for Projects


@app.post("/api/projects", response_model=ProjectResponse, status_code=201)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """
    Create a new video project.

    Validation:
    - Project name is automatically trimmed of leading/trailing whitespace
    - Empty descriptions are converted to null
    - Duplicate names rejected (case-insensitive)
    - Database-level unique constraint enforced

    Args:
        project: Project data (name, description, status)
        db: Database session

    Returns:
        ProjectResponse: Created project object

    Raises:
        HTTPException: 400 if project with same name already exists (case-insensitive)

    Related: Issue #27, Issue #30
    """
    # Check for duplicate names (case-insensitive)
    # Using ilike() for case-insensitive comparison handles different capitalization
    # Note: Name has already been trimmed by Pydantic validator
    existing_project = (
        db.query(Project).filter(Project.name.ilike(project.name)).first()
    )
    if existing_project:
        raise HTTPException(
            status_code=400, detail=f"A project named '{project.name}' already exists"
        )

    db_project = Project(
        name=project.name, description=project.description, status=project.status
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
        raise HTTPException(
            status_code=400,
            detail=f"A project named '{project.name}' already exists",
        ) from None


@app.get("/api/projects", response_model=list[ProjectResponse])
async def get_projects(db: Session = Depends(get_db)):
    """
    Get list of all video projects, ordered by creation date (newest first).

    Args:
        db: Database session

    Returns:
        List[ProjectResponse]: List of all projects, sorted by created_at DESC
    """
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return projects


@app.get("/api/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: Session = Depends(get_db)):
    """
    Get a specific video project by ID.

    Args:
        project_id: Project ID
        db: Database session

    Returns:
        ProjectResponse: Project object

    Raises:
        HTTPException: 404 if project not found
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        raise HTTPException(
            status_code=404, detail=f"Project with id {project_id} not found"
        )
    return project


@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int, project_update: ProjectUpdate, db: Session = Depends(get_db)
):
    """
    Update an existing video project.

    Validation:
    - Project name is automatically trimmed of leading/trailing whitespace (if provided)
    - Empty descriptions are converted to null
    - Duplicate names rejected (case-insensitive)
    - Database-level unique constraint enforced

    Args:
        project_id: Project ID
        project_update: Updated project data
        db: Database session

    Returns:
        ProjectResponse: Updated project object

    Raises:
        HTTPException: 404 if project not found
        HTTPException: 400 if updating to a name that already exists (case-insensitive)

    Related: Issue #27, Issue #30
    """
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(
            status_code=404, detail=f"Project with id {project_id} not found"
        )

    # Update only provided fields
    update_data = project_update.model_dump(exclude_unset=True)

    # If name is being updated, check for duplicates (excluding current project)
    # Note: Name has already been trimmed by Pydantic validator
    if "name" in update_data:
        existing_project = (
            db.query(Project)
            .filter(Project.name.ilike(update_data["name"]), Project.id != project_id)
            .first()
        )
        if existing_project:
            raise HTTPException(
                status_code=400,
                detail=f"A project named '{update_data['name']}' already exists",
            )

    for field, value in update_data.items():
        setattr(db_project, field, value)

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
        raise HTTPException(
            status_code=400,
            detail=f"A project named '{project_name}' already exists",
        ) from None


@app.delete("/api/projects/{project_id}", status_code=204)
async def delete_project(project_id: int, db: Session = Depends(get_db)):
    """
    Delete a video project.

    Args:
        project_id: Project ID
        db: Database session

    Raises:
        HTTPException: 404 if project not found
    """
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if db_project is None:
        raise HTTPException(
            status_code=404, detail=f"Project with id {project_id} not found"
        )

    db.delete(db_project)
    db.commit()
    return None
