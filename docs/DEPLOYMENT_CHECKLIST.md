# Production Deployment Checklist

## Overview

Use this checklist when deploying the YouTube Assistant to production. Follow each step to ensure a successful deployment with minimal downtime.

---

## Pre-Deployment

### Code Quality

- [ ] All tests passing (`pytest` in backend, `npm test` in frontend)
- [ ] Code reviewed and approved (if applicable)
- [ ] No linting errors
- [ ] Documentation updated for any new features

### Version Control

- [ ] All changes committed to git
- [ ] Feature branch merged to main (if applicable)
- [ ] Code pushed to remote repository
- [ ] Tagged release version (optional: `git tag v1.0.0`)

### Database Preparation

- [ ] Migrations tested on development database
- [ ] Migration scripts reviewed for potential issues
- [ ] Database backup taken (see backup section below)
- [ ] Backup verified (can be restored if needed)

### Configuration Review

- [ ] Environment variables documented
- [ ] `DATABASE_URL` configured correctly
- [ ] Port numbers confirmed (avoid conflicts)
- [ ] File paths verified (absolute paths for production)

### Communication

- [ ] Team notified of deployment (if applicable)
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan reviewed

---

## Deployment Steps

### 1. Backup Current Production

```bash
# Backup current production database
cd ~/production/youtube-assistant/backend
cp youtube_assistant_prod.db youtube_assistant_prod.backup.$(date +%Y%m%d_%H%M%S).db

# Backup production code (optional)
cd ~/production
tar -czf youtube-assistant-backup-$(date +%Y%m%d_%H%M%S).tar.gz youtube-assistant/
```

- [ ] Production database backed up
- [ ] Production code backed up (optional)
- [ ] Backup location documented

### 2. Update Production Code

```bash
cd ~/production/youtube-assistant

# Option A: Git pull (if using version control)
git pull origin main

# Option B: Rsync from development
rsync -av ~/dev/aqa-youtube-assistant/ ~/production/youtube-assistant/ \
  --exclude=node_modules \
  --exclude=.venv \
  --exclude=__pycache__ \
  --exclude=*.db \
  --exclude=.git
```

- [ ] Latest code deployed to production directory
- [ ] Deployment method documented

### 3. Update Backend Dependencies

```bash
cd ~/production/youtube-assistant/backend
source .venv/bin/activate
pip install -r requirements.txt
```

- [ ] Virtual environment activated
- [ ] Dependencies installed/updated
- [ ] No installation errors

### 4. Update Frontend Dependencies

```bash
cd ~/production/youtube-assistant/frontend
npm install
```

- [ ] Node modules installed/updated
- [ ] No installation errors

### 5. Build Frontend

```bash
cd ~/production/youtube-assistant/frontend
npm run build
```

- [ ] Frontend built successfully
- [ ] Build artifacts generated
- [ ] No build errors or warnings

### 6. Configure Environment Variables

```bash
# Set production database URL
export DATABASE_URL="sqlite:///$(pwd)/youtube_assistant_prod.db"

# Or add to systemd service file if using systemd
```

- [ ] `DATABASE_URL` set correctly
- [ ] Other environment variables configured (if any)
- [ ] Environment persisted (systemd service or shell profile)

### 7. Start/Restart Backend

**If using systemd:**
```bash
sudo systemctl restart youtube-assistant-backend
```

**If running manually:**
```bash
cd ~/production/youtube-assistant/backend
source .venv/bin/activate
DATABASE_URL="sqlite:///$(pwd)/youtube_assistant_prod.db" \
  uvicorn app.main:app --host 0.0.0.0 --port 8001
```

- [ ] Backend service started/restarted
- [ ] Migrations run automatically (check logs for "🔄 Running database migrations...")
- [ ] No startup errors

### 8. Start/Restart Frontend

**If using systemd:**
```bash
sudo systemctl restart youtube-assistant-frontend
```

**If running manually:**
```bash
cd ~/production/youtube-assistant/frontend
PORT=3001 npm start
```

- [ ] Frontend service started/restarted
- [ ] No startup errors

---

## Post-Deployment

### Verification

#### 1. Check Application Access

```bash
# Backend API
curl http://localhost:8001/api/health

# Frontend
curl http://localhost:3001
```

- [ ] Backend API responding
- [ ] Frontend loading
- [ ] API documentation accessible (http://localhost:8001/docs)

#### 2. Check Migration Status

```bash
# Check backend startup logs for migration messages
sudo journalctl -u youtube-assistant-backend -n 50 | grep -i migration

# Or if running manually, check console output
```

- [ ] Migrations completed successfully
- [ ] No migration errors in logs
- [ ] Database schema up to date

#### 3. Test Critical Functionality

- [ ] Create a new workspace (POST /api/workspaces/)
- [ ] List workspaces (GET /api/workspaces/)
- [ ] Create a new project (POST /api/projects/)
- [ ] List projects (GET /api/projects/)
- [ ] Update a project (PUT /api/projects/{id})
- [ ] Delete test data

#### 4. Check Logs

```bash
# Systemd services
sudo journalctl -u youtube-assistant-backend -f
sudo journalctl -u youtube-assistant-frontend -f

# Manual runs: check console output
```

- [ ] No error messages in backend logs
- [ ] No error messages in frontend logs
- [ ] Application running without warnings

#### 5. Monitor Performance

- [ ] Response times acceptable
- [ ] No memory leaks observed
- [ ] CPU usage normal

### Documentation

- [ ] Update deployment log (date, version, changes)
- [ ] Document any issues encountered
- [ ] Update deployment procedures if needed
- [ ] Record current production version

### Cleanup

- [ ] Remove old backup files (keep last 5-10)
- [ ] Clean up temporary files
- [ ] Verify disk space usage

---

## Rollback Plan

If deployment fails or critical issues occur:

### 1. Stop Current Services

```bash
# Systemd
sudo systemctl stop youtube-assistant-backend
sudo systemctl stop youtube-assistant-frontend

# Manual: Ctrl+C or kill process
```

- [ ] Services stopped

### 2. Restore Database Backup

```bash
cd ~/production/youtube-assistant/backend

# Find most recent backup
ls -lt youtube_assistant_prod.backup.*

# Restore backup
cp youtube_assistant_prod.backup.YYYYMMDD_HHMMSS.db youtube_assistant_prod.db
```

- [ ] Database backup identified
- [ ] Database restored from backup
- [ ] Backup verified (correct timestamp)

### 3. Revert Code (if needed)

```bash
cd ~/production/youtube-assistant

# Git revert
git reset --hard HEAD~1

# Or restore from code backup
cd ~/production
rm -rf youtube-assistant
tar -xzf youtube-assistant-backup-YYYYMMDD_HHMMSS.tar.gz
```

- [ ] Code reverted to previous version
- [ ] Dependencies reinstalled (if needed)

### 4. Restart Services

```bash
# Systemd
sudo systemctl start youtube-assistant-backend
sudo systemctl start youtube-assistant-frontend

# Manual: restart using normal startup commands
```

- [ ] Services restarted
- [ ] Application accessible

### 5. Verify Rollback

- [ ] Application loads successfully
- [ ] Critical functionality working
- [ ] Data intact

### 6. Investigate and Document

- [ ] Document what went wrong
- [ ] Identify root cause
- [ ] Create plan to fix issues
- [ ] Update deployment procedures
- [ ] Schedule fix and redeploy

---

## Troubleshooting

### Common Issues

#### Backend Won't Start

**Check:**
- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] `DATABASE_URL` set correctly
- [ ] Port not already in use (`lsof -i :8001`)
- [ ] Database file permissions correct

#### Frontend Won't Build

**Check:**
- [ ] Node modules installed (`npm install`)
- [ ] No syntax errors in code
- [ ] `package.json` correct
- [ ] Sufficient disk space

#### Migrations Fail

**Check:**
- [ ] Database not locked (close all connections)
- [ ] Database file writable
- [ ] Migration files valid
- [ ] Previous migrations completed

#### Can't Connect to Database

**Check:**
- [ ] `DATABASE_URL` environment variable set
- [ ] Database file exists
- [ ] File path correct (absolute path for production)
- [ ] Database file permissions correct

#### Port Already in Use

```bash
# Find process using port
lsof -i :8001
sudo lsof -i :8001

# Kill process
kill -9 <PID>

# Or use different port
```

---

## Environment-Specific Notes

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Database | `youtube_assistant.db` | `youtube_assistant_prod.db` |
| Backend Port | 8000 | 8001 |
| Frontend Port | 3000 | 3001 |
| Auto-reload | Yes (`--reload`) | No |
| Debug Mode | Enabled | Disabled |
| Log Level | DEBUG | INFO |

### Multiple Instances

When running development and production simultaneously:

- [ ] Different ports configured
- [ ] Different database files
- [ ] No port conflicts
- [ ] No database locking issues

---

## References

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Comprehensive deployment instructions
- [Migration Workflow](./MIGRATION_WORKFLOW.md) - Database migration details
- [Database Management](../backend/docs/DATABASE_MANAGEMENT.md) - Database operations
- [Backend README](../backend/README.md) - Backend setup and development

---

## Deployment Log Template

Use this template to record each deployment:

```
## Deployment: YYYY-MM-DD HH:MM

**Version**: v1.0.0 (or commit SHA)

**Changes**:
- Feature X added
- Bug Y fixed
- Migration Z applied

**Duration**: 15 minutes

**Issues Encountered**: None / Description of issues

**Rolled Back**: No / Yes (reason)

**Deployed By**: Name

**Notes**: Any additional notes
```

---

**Last Updated**: November 1, 2025  
**Related Issue**: #101  
**Part of Epic**: #96 (Database Migration System)
