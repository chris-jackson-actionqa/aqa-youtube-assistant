````prompt
# 🎭 E2E Testing Execution Checklist

## Overview

Simple, concise checklist for running E2E tests with Playwright using external server management scripts.

## Key Architecture Points

- **Test Database**: `backend/youtube_assistant_test.db` (separate from dev database)
- **Backend Server**: FastAPI on port 8000 with test database
- **Frontend Server**: Next.js on port 3000
- **Scripts Location**: `e2e/scripts/`

## Quick Start Checklist

### ✅ Prerequisites (One-Time Setup)

1. **Backend dependencies installed**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Frontend dependencies installed**:
   ```bash
   cd frontend
   npm install
   ```

3. **Playwright browsers installed**:
   ```bash
   cd e2e
   npm install
   npx playwright install
   ```

4. **Scripts executable**:
   ```bash
   chmod +x e2e/scripts/*.sh
   ```

### 🚀 Run E2E Tests (Standard Workflow)

From project root, execute these commands in order:

### 🚀 Run E2E Tests (Standard Workflow)

From project root, execute these commands in order:

```bash
# 1. Setup test database
cd backend
../e2e/scripts/setup-test-database.sh

# 2. Start backend server
../e2e/scripts/start-backend.sh

# 3. Start frontend server
cd ../frontend
../e2e/scripts/start-frontend.sh

# 4. Run tests
cd ../e2e
npm test

# 5. Stop servers
cd ..
./e2e/scripts/kill-backend.sh
./e2e/scripts/kill-frontend.sh
```

### ⚡ One-Line Command (Quick Run)

```bash
cd backend && \
../e2e/scripts/setup-test-database.sh && \
../e2e/scripts/start-backend.sh && \
cd ../frontend && \
../e2e/scripts/start-frontend.sh && \
cd ../e2e && \
npm test && \
cd .. && \
./e2e/scripts/kill-backend.sh && \
./e2e/scripts/kill-frontend.sh
```

### 🔄 Multiple Test Runs (Keep Servers Running)

```bash
# One-time setup
cd backend
../e2e/scripts/setup-test-database.sh
../e2e/scripts/start-backend.sh
cd ../frontend
../e2e/scripts/start-frontend.sh

# Run tests multiple times
cd ../e2e
npm test
npm test templates  # Run specific test file

# Cleanup when done
cd ..
./e2e/scripts/kill-backend.sh
./e2e/scripts/kill-frontend.sh
```

## Troubleshooting

### Port Already in Use

```bash
./e2e/scripts/kill-backend.sh
./e2e/scripts/kill-frontend.sh
```

### Database Issues

```bash
cd backend
../e2e/scripts/setup-test-database.sh
```

### View Server Logs

```bash
tail -f /tmp/e2e-backend-*.log
tail -f /tmp/e2e-frontend-*.log
```

### View Test Report (Optional)

```bash
cd e2e
npx playwright show-report  # Press Ctrl+C to stop server
```

## Script Reference

| Script | Purpose |
|--------|---------|
| `setup-test-database.sh` | Reset test database, run migrations |
| `start-backend.sh` | Start FastAPI on port 8000 |
| `start-frontend.sh` | Start Next.js on port 3000 |
| `kill-backend.sh` | Stop backend server |
| `kill-frontend.sh` | Stop frontend server |

## Quick Reference Commands

```bash
# Check port availability
lsof -i :8000
lsof -i :3000

# Run all tests
cd e2e && npm test

# Run specific test file
cd e2e && npm test templates

# Run with visible browser
cd e2e && npm test -- --headed

# Debug mode
cd e2e && npm test -- --debug
```

---

**Related Documentation**:
- Test Automation Agent: `.github/prompts/test-automation-agent.prompt.md`
- Scripts README: `e2e/scripts/README.md`
- Playwright Config: `e2e/playwright.config.ts`

---

**Version**: 2.0.0 (Simplified)  
**Last Updated**: January 2025

````