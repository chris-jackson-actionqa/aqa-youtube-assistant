# Deployment Feature - Phase 1 (MVP)

**Epic**: #123  
**Status**: 🚧 Planning Complete, Ready to Implement  
**Date Created**: November 2, 2025

## Overview

Phase 1 focuses on creating a **simple, practical deployment solution** that allows running the application in production mode with separate database and ports from development/test environments.

**Philosophy**: Start simple, build incrementally. Get something working quickly, then enhance in future phases.

## Goals

### Primary Goals (Phase 1)
- ✅ One-command build process
- ✅ One-command deployment
- ✅ Simple start/stop scripts
- ✅ Separate production environment (ports, database)
- ✅ No interference with development workflow
- ✅ Foundation for future enhancements

### Deferred to Later Phases
- ❌ systemd service integration (Phase 2)
- ❌ Desktop launcher (Phase 2)
- ❌ Auto-start on login (Phase 2)
- ❌ Automatic updates (Phase 3)
- ❌ Backup scheduling (Phase 3)

## Technical Architecture

### Environment Separation

| Environment | Backend Port | Frontend Port | Database | Location |
|-------------|--------------|---------------|----------|----------|
| Development | 8000 | 3000 | `youtube_assistant.db` | `./backend/` |
| Testing | Dynamic | Dynamic | `youtube_assistant_test.db` | `./backend/` |
| **Production** | **8001** | **3001** | `youtube_assistant_prod.db` | `~/aqa-youtube-assistant-prod/` |

**Key Design**: All three environments can run simultaneously without conflicts.

### Production Directory Structure

```
~/aqa-youtube-assistant-prod/
├── backend/
│   ├── app/                          # Application code
│   ├── alembic/                      # Database migrations
│   │   ├── versions/                 # Migration scripts
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── alembic.ini                   # Alembic config
│   ├── requirements.txt              # Python dependencies
│   ├── venv-prod/                    # Production virtual environment
│   ├── .env                          # Production config (from .env.production)
│   └── youtube_assistant_prod.db     # Production database
├── frontend/
│   ├── .next/                        # Built Next.js application
│   ├── public/                       # Static assets
│   ├── node_modules/                 # Node dependencies
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   └── .env                          # Production config (from .env.production)
├── pids/                             # Process ID files
│   ├── backend.pid
│   └── frontend.pid
├── backend.log                       # Backend log file
└── frontend.log                      # Frontend log file
```

### Scripts to Create

All scripts located in `scripts/` directory:

1. **`build-production.sh`** (Issue #125)
   - Builds Next.js frontend (`npm run build`)
   - Creates production virtual environment (`venv-prod`)
   - Installs backend dependencies
   - Idempotent (safe to run multiple times)

2. **`deploy-production.sh`** (Issue #126)
   - Creates production directory (`~/aqa-youtube-assistant-prod/`)
   - Copies backend files (app, alembic, venv, config)
   - Copies frontend files (.next, public, node_modules, config)
   - Renames `.env.production` → `.env` for runtime
   - Runs Alembic migrations to initialize database
   - Idempotent (safe to redeploy)

3. **`start-production.sh`** (Issue #127)
   - Checks if production directory exists
   - Starts backend with uvicorn on port 8001 (background)
   - Starts frontend with `npm start` on port 3001 (background)
   - Saves PIDs for clean shutdown
   - Creates log files
   - Detects if already running (prevents duplicates)

4. **`stop-production.sh`** (Issue #127)
   - Reads PIDs from files
   - Gracefully stops backend and frontend
   - Cleans up PID files
   - Handles missing/stale PIDs gracefully

5. **`status-production.sh`** (Issue #127)
   - Checks if services are running
   - Displays status with ports and PIDs
   - Shows production directory location

### Configuration Files

**Backend** (`.env.production`):
```bash
DATABASE_URL=sqlite:///./youtube_assistant_prod.db
PORT=8001
HOST=0.0.0.0
RELOAD=false
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3001
```

**Frontend** (`.env.production`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
PORT=3001
```

## Implementation Plan

### Issues Created

1. **Issue #124** - Create Production Environment Configuration Files (1-2 hours)
   - Create `backend/.env.production`
   - Create `frontend/.env.production`
   - Create `.env.example` templates
   - Update `.gitignore`

2. **Issue #125** - Create Build Script for Production (2-3 hours)
   - Create `scripts/build-production.sh`
   - Build frontend
   - Setup backend venv-prod
   - Install dependencies

3. **Issue #126** - Create Deployment Script (2-3 hours)
   - Create `scripts/deploy-production.sh`
   - Copy all files to production directory
   - Initialize production database
   - Setup environment configs

4. **Issue #127** - Create Start/Stop Scripts for Production (2-3 hours)
   - Create `scripts/start-production.sh`
   - Create `scripts/stop-production.sh`
   - Create `scripts/status-production.sh`
   - PID management
   - Log file creation

5. **Issue #128** - Update Documentation with Deployment Instructions (2-3 hours)
   - Create `docs/deployment/DEPLOYMENT.md`
   - Create `docs/deployment/TROUBLESHOOTING.md`
   - Update main `README.md`
   - Document all procedures

### Implementation Order

```
#124 (Config Files)
      ↓
#125 (Build Script) ← requires #124
      ↓
#126 (Deploy Script) ← requires #124, #125
      ↓
#127 (Start/Stop Scripts) ← requires #124, #125, #126
      ↓
#128 (Documentation) ← requires all previous
```

**Total Estimated Time**: 9-14 hours (2-3 work sessions)

## Usage Workflow

### Initial Deployment

```bash
# From project root directory
cd ~/dev/aqa-youtube-assistant

# Step 1: Build for production
./scripts/build-production.sh

# Step 2: Deploy to production directory
./scripts/deploy-production.sh

# Step 3: Start production services
./scripts/start-production.sh

# Access application
open http://localhost:3001
```

### Updating Production

```bash
# Pull latest code
git pull origin main

# Stop production
./scripts/stop-production.sh

# Rebuild
./scripts/build-production.sh

# Redeploy (migrations run automatically)
./scripts/deploy-production.sh

# Restart
./scripts/start-production.sh
```

### Daily Usage

```bash
# Start services
./scripts/start-production.sh

# Check status
./scripts/status-production.sh

# Stop services
./scripts/stop-production.sh
```

## Design Decisions

### 1. Simple Scripts vs systemd (Phase 1)

**Decision**: Use simple bash scripts with background processes for Phase 1.

**Rationale**:
- Faster to implement and test
- Lower learning curve
- Easier to debug and modify
- Provides foundation for systemd in Phase 2
- Meets immediate need (separate production environment)

**Alternatives Considered**:
- systemd from start (deferred to Phase 2)
- Docker containers (too complex for single-user desktop)
- PM2 for process management (Node.js-centric, adds dependency)

**Trade-offs**:
- ❌ No auto-start on login (Phase 2)
- ❌ Manual process management
- ✅ Simple and transparent
- ✅ Easy to iterate and improve

### 2. Home Directory Installation

**Decision**: Install to `~/aqa-youtube-assistant-prod/` (user directory).

**Rationale**:
- No sudo/root required
- User-specific installation
- Easy to remove/reinstall
- Follows Linux user application conventions

**Alternatives Considered**:
- `/opt/aqa-youtube-assistant/` (requires sudo)
- `~/.local/share/aqa-youtube-assistant/` (XDG standard, but less discoverable)

### 3. Separate Virtual Environment

**Decision**: Use `venv-prod` instead of reusing development `venv`.

**Rationale**:
- Complete isolation from development dependencies
- Avoids development tools in production (pytest, mypy, ruff)
- Cleaner dependency management
- Safe to delete/rebuild without affecting dev

### 4. Copy vs Symlink

**Decision**: Copy all files to production directory (not symlink).

**Rationale**:
- Production independent from source code changes
- Can delete/modify source without breaking production
- Simpler mental model
- Easier to troubleshoot

**Trade-off**: Uses more disk space (~200-300MB), but acceptable for desktop deployment.

### 5. Log Files in Production Directory

**Decision**: Store logs in production directory, not `/var/log/`.

**Rationale**:
- User-accessible without sudo
- Grouped with application
- Easy to find and tail
- Consistent with user-space installation

### 6. PID Management

**Decision**: Store PIDs in `~/aqa-youtube-assistant-prod/pids/`.

**Rationale**:
- Simple process tracking
- Enables clean shutdown
- Detects stale processes
- No system-wide PID directory needed

## Acceptance Criteria (Epic Level)

- [ ] Production builds successfully with one command
- [ ] Production deploys successfully with one command
- [ ] Production starts/stops successfully with simple commands
- [ ] Production runs on ports 8001/3001 (no dev conflicts)
- [ ] Production uses separate database (`youtube_assistant_prod.db`)
- [ ] Can run dev (8000/3000) and prod (8001/3001) simultaneously
- [ ] Scripts are idempotent (safe to re-run)
- [ ] Scripts provide clear console output
- [ ] Logs are accessible and useful
- [ ] Documentation is complete and accurate

## Testing Strategy

### Manual Testing Checklist

- [ ] Build from clean state
- [ ] Deploy to fresh production directory
- [ ] Start services successfully
- [ ] Access frontend at http://localhost:3001
- [ ] Access backend at http://localhost:8001
- [ ] Verify production database created
- [ ] Stop services cleanly
- [ ] Start dev environment (8000/3000) - no conflicts
- [ ] Run both dev and prod simultaneously
- [ ] Update deployment (rebuild, redeploy, restart)
- [ ] Check log files contain useful information
- [ ] Test status script shows accurate state

### Edge Cases to Test

- [ ] Run start script when already running (should detect)
- [ ] Run stop script when not running (should handle gracefully)
- [ ] Delete PID files while running (test recovery)
- [ ] Kill process manually (test stale PID detection)
- [ ] Run from wrong directory (should error with helpful message)
- [ ] Run without building first (should error)

## Future Enhancements (Later Phases)

### Phase 2 - systemd Integration
- Create systemd user service units
- Auto-start on login
- Proper service management with `systemctl`
- Desktop launcher (`.desktop` file)
- Integration with system tray

### Phase 3 - Advanced Features
- Automatic update mechanism
- Backup scheduling
- Version checking
- Configuration GUI
- Health monitoring
- Log rotation

## Related Documentation

- Epic: #123
- Issues: #124, #125, #126, #127, #128
- Architecture Decision Record: `docs/adr/ADR-003-deployment-strategy.md` (to be created in #128)

## Questions & Answers

### Why not Docker?
**Answer**: Desktop deployment for single user doesn't justify Docker complexity. Simple scripts meet the need with lower overhead.

### Why separate ports instead of same ports?
**Answer**: Allows running dev and prod simultaneously. Critical for testing production builds without stopping development.

### Why copy node_modules instead of npm install in prod?
**Answer**: Faster deployment, guaranteed identical dependencies to build environment.

### Will this work on other Linux distros?
**Answer**: Yes, scripts are distro-agnostic. Tested on Pop_OS (Ubuntu-based), should work on any systemd-based Linux.

### What about Windows/Mac?
**Answer**: Out of scope for Phase 1. Scripts are bash-specific. Could adapt in future.

---

**Last Updated**: November 2, 2025  
**Status**: Planning Complete, Ready to Implement
