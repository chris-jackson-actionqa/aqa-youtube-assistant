# E2E Test Server Management Scripts

This directory contains scripts to manage the frontend and backend servers for E2E testing. These scripts are used both locally and in CI/CD pipelines.

## Overview

Instead of letting Playwright manage the servers (which caused database connection issues), we use dedicated scripts to:
1. Setup the test database
2. Start the backend and frontend servers with proper configuration
3. Clean up servers after testing

## Scripts

### Database Setup

**`setup-test-database.sh`**
- Creates/resets the test database (`youtube_assistant_test.db`)
- Runs database migrations
- Creates default workspace (id=1)
- **Run this before starting servers**

```bash
./scripts/setup-test-database.sh
```

### Backend Server Management

**`start-backend.sh`**
- Activates Python virtual environment
- Checks Python version
- Installs dependencies from `requirements.txt`
- Starts FastAPI server on port 8000 with test database
- Runs in background, logs to `/tmp/e2e-backend.log`

```bash
./scripts/start-backend.sh
```

**`kill-backend.sh`**
- Finds and kills process on port 8000
- Uses `lsof` and `ss` to find the PID
- Graceful shutdown with fallback to force kill

```bash
./scripts/kill-backend.sh
```

### Frontend Server Management

**`start-frontend.sh`**
- Checks Node.js version
- Installs dependencies with `npm install`
- Starts Next.js dev server on port 3000
- Runs in background, logs to `/tmp/e2e-frontend.log`

```bash
./scripts/start-frontend.sh
```

**`kill-frontend.sh`**
- Finds and kills process on port 3000
- Uses `lsof` and `ss` to find the PID
- Graceful shutdown with fallback to force kill

```bash
./scripts/kill-frontend.sh
```

## Usage

### Running E2E Tests Locally

```bash
# 1. Setup test database
./scripts/setup-test-database.sh

# 2. Start backend server
./scripts/start-backend.sh

# 3. Start frontend server
./scripts/start-frontend.sh

# 4. Run Playwright tests
npm test

# 5. Clean up (optional)
./scripts/kill-backend.sh
./scripts/kill-frontend.sh
```

### Quick Test Run

```bash
# All-in-one command
./scripts/setup-test-database.sh && \
./scripts/start-backend.sh && \
./scripts/start-frontend.sh && \
npm test && \
./scripts/kill-backend.sh && \
./scripts/kill-frontend.sh
```

### CI/CD Usage

In GitHub Actions or other CI environments, the scripts automatically:
- Check and display software versions
- Install all dependencies
- Start servers with proper configuration

Example GitHub Actions workflow:
```yaml
- name: Setup test database
  run: cd e2e && ./scripts/setup-test-database.sh

- name: Start backend
  run: cd e2e && ./scripts/start-backend.sh

- name: Start frontend
  run: cd e2e && ./scripts/start-frontend.sh

- name: Run E2E tests
  run: cd e2e && npm test

- name: Cleanup
  if: always()
  run: |
    cd e2e
    ./scripts/kill-backend.sh || true
    ./scripts/kill-frontend.sh || true
```

## Architecture Details

### Why External Server Management?

Previously, Playwright's `webServer` configuration managed servers, but this caused issues:
- Database connection problems (readonly database errors)
- The backend would connect to a database, then global-setup would delete it
- Difficult to debug server startup failures

With external scripts:
- ✅ Database is set up BEFORE servers start
- ✅ Servers maintain stable database connections
- ✅ Better visibility into server logs
- ✅ Easier to debug issues
- ✅ Works consistently in CI and locally

### Database Configuration

The backend server uses `DATABASE_URL` environment variable:
- **Test database**: `sqlite:///./youtube_assistant_test.db`
- **Development database**: `sqlite:///./youtube_assistant.db`

The test database is isolated from development data and is reset before each test run.

### Port Detection

Scripts use both `lsof` and `ss` for robust port detection:
- `lsof -ti :PORT` - Standard method, works on most systems
- `ss -tlnp | grep :PORT` - Fallback method, more reliable in some environments

## Troubleshooting

### Server Won't Start

Check the log files:
```bash
# Backend logs
tail -f /tmp/e2e-backend.log

# Frontend logs
tail -f /tmp/e2e-frontend.log
```

### Port Already in Use

Kill existing servers:
```bash
./scripts/kill-backend.sh
./scripts/kill-frontend.sh
```

Or manually find and kill processes:
```bash
# Find process on port 8000
lsof -ti :8000 | xargs kill -9

# Find process on port 3000
lsof -ti :3000 | xargs kill -9
```

### Database Connection Errors

Reset the test database:
```bash
./scripts/setup-test-database.sh
```

### Virtual Environment Not Found

Create the backend virtual environment:
```bash
cd ../backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Related Documentation

- [E2E Test Plan](../TEST_CASES.md)
- [Playwright Configuration](../playwright.config.ts)
- [Workspace API Documentation](../../backend/docs/WORKSPACE_API.md)
- [Issue #95: Parallel Test Execution](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/95)
