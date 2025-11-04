# Production Deployment Guide

This guide covers deploying the AQA YouTube Assistant to a production environment on Linux (Pop_OS/Ubuntu).

## Overview

The production deployment:
- Runs on separate ports: **8001** (backend), **3001** (frontend)
- Uses separate database: `youtube_assistant_prod.db`
- Installs to: `~/aqa-youtube-assistant-prod/`
- Does not interfere with development environment

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Git repository cloned to development location

## Quick Start

From the project root directory:

```bash
# 1. Build for production
./scripts/build-production.sh

# 2. Deploy to production directory
./scripts/deploy-production.sh

# 3. Start production services
./scripts/start-production.sh

# Access at: http://localhost:3001
```

## Detailed Steps

### 1. Build for Production

```bash
./scripts/build-production.sh
```

This script:
- Builds Next.js frontend for production
- Creates production virtual environment (`backend/venv-prod/`)
- Installs backend dependencies

**Time**: ~2-5 minutes depending on system

### 2. Deploy to Production Directory

```bash
./scripts/deploy-production.sh
```

This script:
- Creates production directory at `~/aqa-youtube-assistant-prod/`
- Copies built frontend and backend files
- Initializes production database with Alembic migrations
- Sets up production environment configuration

**Production directory structure**:
```
~/aqa-youtube-assistant-prod/
├── backend/
│   ├── app/              # Application code
│   ├── alembic/          # Database migrations
│   ├── venv-prod/        # Python virtual environment
│   ├── .env              # Production config (port 8001)
│   └── youtube_assistant_prod.db  # Production database
├── frontend/
│   ├── .next/            # Built Next.js application
│   ├── public/           # Static assets
│   ├── node_modules/     # Dependencies
│   └── .env              # Production config (port 3001)
├── pids/                 # Process ID files
├── backend.log           # Backend log file
└── frontend.log          # Frontend log file
```

### 3. Start Production Services

```bash
./scripts/start-production.sh
```

This script:
- Starts backend on port 8001 (http://localhost:8001)
- Starts frontend on port 3001 (http://localhost:3001)
- Runs both in background
- Creates log files

**Access points**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8001
- API Documentation: http://localhost:8001/docs

### 4. Stop Production Services

```bash
./scripts/stop-production.sh
```

Gracefully stops both backend and frontend services.

### 5. Check Status

```bash
./scripts/status-production.sh
```

Shows current status of production services (running/stopped).

## Port Configuration

| Environment | Backend | Frontend | Database |
|-------------|---------|----------|----------|
| Development | 8000    | 3000     | `youtube_assistant.db` |
| Testing     | Dynamic | Dynamic  | `youtube_assistant_test.db` |
| Production  | 8001    | 3001     | `youtube_assistant_prod.db` |

**No port conflicts** - All environments can run simultaneously.

## Environment Files

Production uses separate environment files:

**Backend** (`backend/.env.production`):
```bash
DATABASE_URL=sqlite:///./youtube_assistant_prod.db
PORT=8001
HOST=0.0.0.0
RELOAD=false
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3001
```

**Frontend** (`frontend/.env.production`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
PORT=3001
```

## Updating Production

To deploy updates:

```bash
# 1. Pull latest code
git pull origin main

# 2. Stop production
./scripts/stop-production.sh

# 3. Rebuild
./scripts/build-production.sh

# 4. Redeploy
./scripts/deploy-production.sh

# 5. Restart
./scripts/start-production.sh
```

**Database migrations** are applied automatically during deployment.

## Troubleshooting

### Services Won't Start

**Check if ports are in use**:
```bash
# Check backend port
lsof -i :8001

# Check frontend port
lsof -i :3001
```

**Check logs**:
```bash
# Backend log
tail -f ~/aqa-youtube-assistant-prod/backend.log

# Frontend log
tail -f ~/aqa-youtube-assistant-prod/frontend.log
```

### Database Issues

**Production database location**:
```
~/aqa-youtube-assistant-prod/backend/youtube_assistant_prod.db
```

**Reset database** (⚠️ DELETES ALL DATA):
```bash
# Stop services first
./scripts/stop-production.sh

# Delete database
rm ~/aqa-youtube-assistant-prod/backend/youtube_assistant_prod.db

# Redeploy (recreates database)
./scripts/deploy-production.sh

# Restart
./scripts/start-production.sh
```

### Port Conflicts

If you see "Address already in use" errors:

```bash
# Find process using port 8001
lsof -i :8001
kill <PID>

# Find process using port 3001
lsof -i :3001
kill <PID>
```

### Stale PID Files

If status shows "STOPPED (stale PID file)":

```bash
rm ~/aqa-youtube-assistant-prod/pids/*.pid
```

## Logs

Production logs are stored in the production directory:

```bash
# View backend log
tail -f ~/aqa-youtube-assistant-prod/backend.log

# View frontend log
tail -f ~/aqa-youtube-assistant-prod/frontend.log
```

## Backup and Restore

### Backup Production Database

```bash
# Create backup directory
mkdir -p ~/backups

# Copy database
cp ~/aqa-youtube-assistant-prod/backend/youtube_assistant_prod.db \
   ~/backups/youtube_assistant_prod_$(date +%Y%m%d_%H%M%S).db
```

### Restore Database

```bash
# Stop services
./scripts/stop-production.sh

# Restore from backup
cp ~/backups/youtube_assistant_prod_YYYYMMDD_HHMMSS.db \
   ~/aqa-youtube-assistant-prod/backend/youtube_assistant_prod.db

# Start services
./scripts/start-production.sh
```

## Uninstalling

To remove the production installation:

```bash
# 1. Stop services
./scripts/stop-production.sh

# 2. Backup database if needed
cp ~/aqa-youtube-assistant-prod/backend/youtube_assistant_prod.db ~/backups/

# 3. Remove production directory
rm -rf ~/aqa-youtube-assistant-prod
```

## Future Enhancements (Phase 2)

- systemd service integration (auto-start on login)
- Desktop launcher (`.desktop` file)
- GUI for start/stop/status
- Automatic updates
- Backup scheduling

## Related Documentation

- Main README: `../README.md`
- Backend API: `../backend/docs/API_TESTING_GUIDE.md`
- Database Management: `../backend/docs/DATABASE_MANAGEMENT.md`
