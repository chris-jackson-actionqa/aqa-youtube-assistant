# Deployment Documentation

This directory contains documentation for the desktop deployment feature.

## Overview

The deployment feature enables running the AQA YouTube Assistant as a production application on Linux (Pop_OS/Ubuntu) with:
- Separate production environment (ports, database)
- Simple build and deployment scripts
- Background process management
- Clean separation from development workflow

## Documentation Structure

### Planning Documents

- **[PHASE-1-MVP.md](./PHASE-1-MVP.md)** - Phase 1 planning, architecture, and design decisions
  - Technical architecture
  - Implementation plan
  - Design decisions and rationale
  - Future enhancement roadmap

### Implementation Guides (Created in Issue #128)

- **DEPLOYMENT.md** - Complete deployment guide (user-facing)
  - Quick start instructions
  - Detailed deployment steps
  - Configuration reference
  - Update procedures

- **TROUBLESHOOTING.md** - Common issues and solutions
  - Port conflicts
  - Database issues
  - Service startup problems
  - Log analysis

### Architecture Decision Records

- **[../adr/ADR-003-deployment-strategy.md](../adr/)** - Deployment strategy ADR (to be created in #128)
  - Why scripts vs systemd (Phase 1)
  - Why home directory installation
  - Why separate virtual environment

## Epic & Issues

**Epic**: [#123](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/123) - Simple Desktop Deployment (Phase 1 - MVP)

**Sub-Issues**:
1. [#124](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/124) - Create Production Environment Configuration Files
2. [#125](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/125) - Create Build Script for Production
3. [#126](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/126) - Create Deployment Script
4. [#127](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/127) - Create Start/Stop Scripts for Production
5. [#128](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/128) - Update Documentation with Deployment Instructions

## Quick Reference

### Scripts (in `scripts/` directory)

```bash
./scripts/build-production.sh      # Build for production
./scripts/deploy-production.sh     # Deploy to ~/aqa-youtube-assistant-prod/
./scripts/start-production.sh      # Start services
./scripts/stop-production.sh       # Stop services
./scripts/status-production.sh     # Check status
```

### Production Environment

- **Location**: `~/aqa-youtube-assistant-prod/`
- **Backend**: http://localhost:8001
- **Frontend**: http://localhost:3001
- **Database**: `youtube_assistant_prod.db`

### Environment Separation

| Environment | Backend | Frontend | Database |
|-------------|---------|----------|----------|
| Development | 8000    | 3000     | `youtube_assistant.db` |
| Testing     | Dynamic | Dynamic  | `youtube_assistant_test.db` |
| Production  | 8001    | 3001     | `youtube_assistant_prod.db` |

## Implementation Status

**Phase 1 (Current)**:
- ⏳ Issue #124 - Config Files
- ⏳ Issue #125 - Build Script
- ⏳ Issue #126 - Deploy Script
- ⏳ Issue #127 - Start/Stop Scripts
- ⏳ Issue #128 - Documentation

**Future Phases**:
- Phase 2: systemd integration, desktop launcher
- Phase 3: Auto-updates, backup scheduling

## Related Documentation

- [Main README](../../README.md)
- [Project Management](../PROJECT_MANAGEMENT.md)
- [Backend API Guide](../../backend/docs/API_TESTING_GUIDE.md)
- [Database Management](../../backend/docs/DATABASE_MANAGEMENT.md)

---

**Last Updated**: November 2, 2025  
**Status**: Planning Complete
