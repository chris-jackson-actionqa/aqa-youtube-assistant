# aqa-youtube-assistant

Helper for planning and making YouTube videos for the ActionaQA channel.

This application consists of a **Next.js frontend** and a **FastAPI backend**.

## Project Structure

```
aqa-youtube-assistant/
├── frontend/          # Next.js application (TypeScript, Tailwind CSS)
├── backend/           # FastAPI application (Python)
└── README.md          # This file
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- pip

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
uvicorn app.main:app --reload
```

The backend API will be available at http://localhost:8000

- API Documentation (Swagger): http://localhost:8000/docs
- Alternative API Documentation (ReDoc): http://localhost:8000/redoc

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Development

### Backend Development

The FastAPI backend provides RESTful API endpoints for managing YouTube video ideas. Key files:

- `backend/app/main.py` - Main application file with API routes
- `backend/requirements.txt` - Python dependencies

API Endpoints:
- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/videos` - List video ideas
- `POST /api/videos` - Create new video idea

### Frontend Development

The Next.js frontend provides a user interface to interact with the backend API. Key files:

- `frontend/app/page.tsx` - Main page component
- `frontend/app/layout.tsx` - Root layout
- `frontend/app/globals.css` - Global styles

## Building for Production

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## License

This project is for the ActionaQA YouTube channel.

