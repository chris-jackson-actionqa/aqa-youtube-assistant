from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .database import engine, get_db
from .models import Base, Video
from .schemas import ProjectCreate, ProjectUpdate, ProjectResponse

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="YouTube Assistant API",
    description="Backend API for YouTube video planning assistant",
    version="1.0.0"
)

# Configure CORS to allow the Next.js frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3031"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint returning API information"""
    return {
        "message": "YouTube Assistant API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# CRUD Operations for Projects

@app.post("/api/projects", response_model=ProjectResponse, status_code=201)
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """
    Create a new video project.
    
    Args:
        project: Project data (title, description, status)
        db: Database session
        
    Returns:
        ProjectResponse: Created project object
    """
    db_project = Video(
        title=project.title,
        description=project.description,
        status=project.status
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/api/projects", response_model=List[ProjectResponse])
async def get_projects(db: Session = Depends(get_db)):
    """
    Get list of all video projects.
    
    Args:
        db: Database session
        
    Returns:
        List[ProjectResponse]: List of all projects
    """
    projects = db.query(Video).all()
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
    project = db.query(Video).filter(Video.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    return project


@app.put("/api/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: int, project_update: ProjectUpdate, db: Session = Depends(get_db)):
    """
    Update an existing video project.
    
    Args:
        project_id: Project ID
        project_update: Updated project data
        db: Database session
        
    Returns:
        ProjectResponse: Updated project object
        
    Raises:
        HTTPException: 404 if project not found
    """
    db_project = db.query(Video).filter(Video.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    
    # Update only provided fields
    update_data = project_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    db_project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_project)
    return db_project


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
    db_project = db.query(Video).filter(Video.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    
    db.delete(db_project)
    db.commit()
    return None
