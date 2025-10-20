from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, get_db, Base
from . import models

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
    allow_origins=["http://localhost:3000"],  # Next.js default port
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

@app.get("/api/videos")
async def get_videos(db: Session = Depends(get_db)):
    """Get list of video ideas"""
    videos = db.query(models.Video).all()
    return {"videos": videos}

@app.post("/api/videos")
async def create_video(video: dict, db: Session = Depends(get_db)):
    """Create a new video idea"""
    db_video = models.Video(
        title=video.get("title"),
        description=video.get("description"),
        status=video.get("status", "planned")
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    return db_video
