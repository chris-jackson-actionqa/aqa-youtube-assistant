from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
async def get_videos():
    """Get list of video ideas"""
    return {
        "videos": [
            {
                "id": 1,
                "title": "Introduction to Test Automation",
                "description": "Learn the basics of test automation",
                "status": "planned"
            },
            {
                "id": 2,
                "title": "Advanced Selenium Techniques",
                "description": "Deep dive into Selenium best practices",
                "status": "in_progress"
            }
        ]
    }

@app.post("/api/videos")
async def create_video(video: dict):
    """Create a new video idea"""
    return {
        "id": 3,
        "title": video.get("title"),
        "description": video.get("description"),
        "status": "planned"
    }
