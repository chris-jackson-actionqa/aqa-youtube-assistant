# E2E Test CI/CD Configuration

This document describes the CI/CD setup for running Playwright E2E tests in GitHub Actions.

## Overview

The E2E test workflow (`.github/workflows/e2e-tests.yml`) automatically runs on:
- Push to `main` branch
- Pull requests targeting `main` branch  
- Manual trigger via `workflow_dispatch`

## Test Environment

### Backend Setup
- **Python Version**: 3.13
- **Database**: SQLite in-memory (`:memory:`)
  - Faster than file-based SQLite
  - Complete isolation between test runs
  - No cleanup needed
- **Server**: Uvicorn running on port 8000
- **Health Check**: Polls `/api/health` endpoint before tests

### Frontend Setup
- **Node Version**: 20
- **Build**: Production build (`npm run build`)
- **Server**: Next.js production server on port 3000
- **Health Check**: Polls root endpoint before tests

### E2E Test Execution
- **Framework**: Playwright
- **Browser**: Chromium (configurable for more browsers)
- **Workers**: 1 (sequential execution for better test isolation)
- **Retries**: 2 on CI, 0 locally
- **Timeout**: 30 seconds per test

## Workflow Steps

1. **Checkout code** - Get latest code from repository
2. **Setup Python** - Install Python 3.13 with pip caching
3. **Install backend deps** - Install Python packages
4. **Start backend** - Launch Uvicorn server with in-memory DB
5. **Setup Node.js** - Install Node 20 with npm caching
6. **Install frontend deps** - Run `npm ci` for reproducible builds
7. **Build frontend** - Create production build
8. **Start frontend** - Launch Next.js production server
9. **Install Playwright** - Install browser binaries
10. **Run E2E tests** - Execute Playwright test suite
11. **Upload artifacts** - Save reports, screenshots, videos
12. **Cleanup** - Stop servers and clean up processes

## Artifacts

The workflow uploads the following artifacts on test completion:

### Always Uploaded
- **playwright-report** - Full HTML test report (30 day retention)
- **test-results** - JSON test results (7 day retention)

### On Failure Only
- **screenshots** - Screenshots of failed tests (7 day retention)
- **videos** - Screen recordings of failed tests (7 day retention)

## Local vs CI Differences

| Feature | Local | CI |
|---------|-------|-----|
| Database | File-based SQLite | In-memory SQLite |
| Server Start | Auto by Playwright | Manual by workflow |
| Build | Dev mode | Production mode |
| Retries | 0 | 2 |
| Server Reuse | Yes | No |
| Cleanup | Auto | Explicit |

## Configuration Files

### `.github/workflows/e2e-tests.yml`
GitHub Actions workflow definition

### `e2e/playwright.config.ts`
Playwright test configuration
- CI detection via `process.env.CI`
- Disables auto-server-start in CI
- Configures timeouts, reporters, artifacts

### `e2e/helpers/test-helpers.ts`
Test helper functions
- Database cleanup between tests
- API request helpers
- Page object patterns

## Environment Variables

Set in workflow or available to tests:

```bash
CI=true                    # Indicates CI environment
NODE_ENV=test             # Node environment mode
PYTHONUNBUFFERED=1        # Python output not buffered
DATABASE_URL=sqlite:///:memory:  # In-memory test database
```

## Test Database Strategy

### CI Environment
Uses **in-memory SQLite database** (`sqlite:///:memory:`):

**Benefits:**
- ✅ Fastest possible database operations
- ✅ Complete isolation - no state leakage between test runs
- ✅ No cleanup required - DB destroyed when process ends
- ✅ No file I/O overhead
- ✅ No locking issues

**Tradeoffs:**
- ❌ Can't inspect database after tests (not needed in CI)
- ❌ Database lost on server restart (acceptable for tests)

### Local Development
Uses **file-based SQLite** for easier debugging:
- Database persists between test runs
- Can inspect with SQLite browser tools
- Matches production database type more closely

### Test Isolation
Each test suite run starts with a fresh database:
- In CI: New in-memory DB per workflow run
- Locally: `clearDatabase()` helper cleans between tests
- No test interference or flakiness from stale data

## Debugging Failed Tests

### View Test Reports
1. Go to GitHub Actions run
2. Click on "Summary" tab
3. Download "playwright-report" artifact
4. Unzip and open `index.html` in browser

### View Screenshots
1. Download "screenshots" artifact (if test failed)
2. Screenshots named by test case
3. Shows exact UI state at failure

### View Videos
1. Download "videos" artifact (if test failed)
2. Videos show full test execution
3. Helps identify timing issues or unexpected behavior

### Run Locally
```bash
cd e2e
npm run test:e2e
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:debug   # Debug mode with step-through
```

## Extending the Workflow

### Add More Browsers
Edit workflow matrix:
```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
```

### Parallel Execution
Increase workers in `playwright.config.ts`:
```typescript
workers: process.env.CI ? 2 : 4,
```

Note: Requires proper test isolation strategy (see Epic #18, Issue #78)

### Add Visual Regression
Add visual tests and baseline management to workflow.
See test-automation-agent.md for patterns.

## Troubleshooting

### Backend not starting
- Check Python version is 3.13
- Check all dependencies installed
- Check port 8000 not already in use
- Check health endpoint responding

### Frontend not starting
- Check Node version is 20
- Check build succeeded
- Check port 3000 not already in use
- Check frontend health endpoint

### Tests timing out
- Increase `timeout` in playwright.config.ts
- Check network conditions in CI
- Review test helper wait logic

### Database errors
- Ensure `DATABASE_URL` environment variable set
- Check SQLAlchemy models are correct
- Verify test cleanup is working

### Flaky tests
- Review test isolation
- Check for race conditions
- Add explicit waits for async operations
- Consider sequential execution (workers: 1)

## Performance

Current workflow execution time:
- Setup (checkout, install deps): ~2-3 minutes
- Build and start servers: ~1-2 minutes  
- Test execution: ~30-60 seconds
- **Total: ~4-6 minutes**

Optimization opportunities:
- Parallel test execution (with proper isolation)
- Dependency caching (already enabled)
- Sharding across multiple jobs
- Docker container with pre-built images

## Related Documentation

- [Test Automation Agent](../.github/prompts/test-automation-agent.md)
- [E2E Testing Guide](../e2e/README.md)
- [Playwright Documentation](https://playwright.dev)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## Maintenance

This workflow should be reviewed and updated when:
- Python version changes
- Node version changes
- New test types added (visual, accessibility)
- New browsers needed
- Performance optimization required

---

**Last Updated**: October 27, 2025  
**Owner**: Test Automation Team  
**Related Issues**: #24 (Test DB CI Setup), #18 (E2E Epic), #23 (GitHub Actions)
