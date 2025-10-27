# Branch Protection Rules

## Overview
The `main` branch is protected to ensure code quality and prevent broken code from being merged to production. All changes must go through pull requests with automated quality checks.

## Required Checks

All pull requests to `main` must pass these automated tests:

### 1. **E2E Tests** (Playwright)
- **Job Name**: `Run Playwright E2E Tests`
- **Workflow**: `.github/workflows/e2e-tests.yml`
- **What it tests**: Complete user workflows from frontend to backend
- **Browsers**: Chromium (Firefox and WebKit can be added)
- **Timeout**: 15 minutes

### 2. **Backend Tests** (Pytest)
- **Job Name**: `Run Backend Unit & Integration Tests`
- **Workflow**: `.github/workflows/backend-tests.yml`
- **What it tests**: FastAPI endpoints, database models, business logic
- **Coverage Required**: 95%+ (enforced by `--cov-fail-under=95`)
- **Timeout**: 10 minutes

### 3. **Frontend Tests** (Jest)
- **Job Name**: `Run Frontend Unit Tests (Jest)`
- **Workflow**: `.github/workflows/frontend-tests.yml`
- **What it tests**: React components, hooks, API client functions
- **Coverage Required**: 98%+ (configured in `jest.config.mjs`)
- **Timeout**: 10 minutes

## Merging Requirements

Before a pull request can be merged to `main`, it must satisfy:

- ✅ All status checks pass (E2E, Backend, Frontend tests)
- ✅ Branch is up to date with `main`
- ✅ All conversations are resolved
- ✅ At least 1 approving review (if enabled)
- ❌ No force pushes allowed to `main`
- ❌ No direct commits to `main`

## What If Tests Fail?

### E2E Test Failures

**Viewing the failure:**
1. Go to [GitHub Actions](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions)
2. Click on the failed workflow run
3. Download artifacts:
   - `playwright-report-chromium` - HTML report with test results
   - `screenshots-chromium` - Screenshots of failures
   - `videos-chromium` - Video recordings of test runs

**Common causes:**
- Backend API changes not reflected in frontend
- Timing issues (race conditions)
- Selector changes in UI components
- API endpoint errors

**How to fix:**
```bash
# Run E2E tests locally
cd e2e
npm test

# Debug with UI
npm run test:ui

# Run specific test file
npx playwright test tests/project-creation.spec.ts

# View last test report
npm run test:report
```

### Backend Test Failures

**Viewing the failure:**
1. Check the workflow run logs
2. Look for the specific test that failed
3. Download `backend-coverage-report` artifact if needed

**Common causes:**
- Database model changes
- Missing test cases for new endpoints
- Coverage drops below 95%
- Breaking changes in API logic

**How to fix:**
```bash
# Run backend tests locally
cd backend
pytest unit_tests/ integration_tests/ -v

# Run with coverage report
pytest unit_tests/ integration_tests/ -v --cov=app --cov-report=term-missing

# Run specific test file
pytest unit_tests/test_projects_api.py -v

# Check coverage threshold
pytest unit_tests/ integration_tests/ --cov=app --cov-fail-under=95
```

### Frontend Test Failures

**Viewing the failure:**
1. Check the workflow run logs
2. Look for the specific test that failed
3. Download `frontend-coverage-report` artifact

**Common causes:**
- Component logic changes
- Missing tests for new components
- Coverage drops below 98%
- API mocking issues

**How to fix:**
```bash
# Run frontend tests locally
cd frontend
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- ProjectForm.test.tsx

# Update snapshots if needed
npm test -- -u
```

## Bypassing Protection (Emergency Only)

**⚠️ WARNING: DO NOT BYPASS UNLESS ABSOLUTELY NECESSARY**

Branch protection rules can be bypassed by repository administrators, but this should only be done in emergencies:

### When bypass might be justified:
- Critical production bug fix needed immediately
- CI/CD infrastructure is down (not test failures)
- Urgent security patch

### Process for emergency bypass:
1. **Document the reason** in PR comments with full context
2. **Create a follow-up issue** to fix the skipped tests immediately
3. **Use admin privileges** to merge despite failing checks
4. **Fix the issue** within 24 hours and create PR to restore quality

### Never bypass for:
- ❌ Test failures that are legitimate bugs
- ❌ Coverage drops you don't want to fix
- ❌ "It works on my machine" situations
- ❌ Convenience or time pressure

## Updating Branch Protection

Only repository administrators can update branch protection rules.

### Via GitHub UI:
1. Go to **Settings** → **Branches**
2. Edit the `main` branch rule
3. Update required status checks
4. Save changes

### Via GitHub CLI:
```bash
# View current protection
gh api repos/chris-jackson-actionqa/aqa-youtube-assistant/branches/main/protection

# Update protection (requires admin)
# See GitHub REST API documentation for structure
```

### Required Status Check Names:
When configuring branch protection, use these exact job names:
- `Run Playwright E2E Tests`
- `Run Backend Unit & Integration Tests`
- `Run Frontend Unit Tests (Jest)`

## Best Practices

### ✅ Do's
- Run tests locally before pushing
- Keep PRs small and focused (easier to review and debug)
- Write tests for new features as you develop
- Maintain or improve test coverage
- Resolve all review comments before merging
- Keep your branch up to date with `main`
- Use descriptive commit messages

### ❌ Don'ts
- Don't bypass branch protection rules
- Don't force push to `main`
- Don't merge failing PRs "temporarily"
- Don't lower coverage thresholds without team discussion
- Don't commit directly to `main`
- Don't ignore test failures
- Don't use `git commit --no-verify` to skip pre-commit hooks

## Troubleshooting

### Problem: "Required status check is not passing"

**Solution:**
1. Wait for all workflows to complete (check Actions tab)
2. Review workflow logs for specific failures
3. Fix the failing tests in your branch
4. Push fixes (tests will re-run automatically)

### Problem: "Branch is out of date"

**Solution:**
```bash
# Option 1: Update via GitHub UI
# Click "Update branch" button on PR

# Option 2: Update locally
git checkout main
git pull origin main
git checkout your-feature-branch
git rebase main  # or git merge main
git push --force-with-lease
```

### Problem: "All checks have passed, but merge is blocked"

**Solution:**
- Check if conversations need to be resolved
- Verify required reviewers have approved
- Ensure branch is up to date with `main`
- Check for other branch protection requirements

### Problem: "Tests pass locally but fail in CI"

**Common causes:**
1. **Environment differences**: Check Node/Python versions match
2. **Database state**: CI uses clean database each run
3. **Timing issues**: CI might be slower, causing timeouts
4. **Dependencies**: Ensure `package-lock.json` and `requirements.txt` are committed
5. **Environment variables**: CI uses different env vars

**Debug steps:**
```bash
# Check workflow environment
cat .github/workflows/e2e-tests.yml | grep -A 10 "env:"

# Run tests with CI environment locally
CI=true npm test

# Check Node/Python versions
node --version
python --version
```

## CI/CD Workflow Status

Check current status of automated tests:

[![E2E Tests](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/e2e-tests.yml)
[![Backend Tests](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/backend-tests.yml)
[![Frontend Tests](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/frontend-tests.yml/badge.svg)](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/actions/workflows/frontend-tests.yml)

## Related Documentation

- [Git & GitHub Workflow Checklist](../.github/workflows/GIT_GITHUB_WORKFLOW_CHECKLIST.md) - Development workflow
- [E2E Testing Guide](../frontend/docs/E2E_TESTING_GUIDE.md) - Playwright testing patterns
- [Testing Setup](../frontend/docs/TESTING_SETUP.md) - Frontend testing configuration
- [Backend Testing Summary](../backend/docs/TESTING_SUMMARY.md) - Backend testing guide
- [Pull Request Template](../.github/PULL_REQUEST_TEMPLATE.md) - PR checklist

---

**Last Updated**: October 27, 2025  
**Version**: 1.0.0  
**Maintained By**: Project Team
