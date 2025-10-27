# Pull Request

## Description
<!-- Provide a clear and concise description of what this PR does -->



## Related Issues
<!-- Link to the issue(s) this PR addresses -->
Closes #
Related to #

## Type of Change
<!-- Mark the appropriate option with an 'x' -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring (no functionality change)
- [ ] Performance improvement
- [ ] Test addition/update
- [ ] Build/CI change

## Changes Made
<!-- List the specific changes made in this PR -->
- 
- 
- 

## Testing

### Local Testing
<!-- Describe how you tested these changes locally -->

**Test commands run:**
```bash
# Backend tests (if applicable)
cd backend && pytest unit_tests/ integration_tests/ -v --cov=app --cov-fail-under=95

# Frontend tests (if applicable)
cd frontend && npm run test:coverage

# E2E tests (if applicable)
cd e2e && npm test
```

**Test results:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Coverage meets or exceeds threshold:
  - Backend: ≥ 95% (if backend changes)
  - Frontend: ≥ 98% (if frontend changes)

### Manual Testing
<!-- Describe manual testing performed -->
- [ ] Feature works as expected in development environment
- [ ] Tested edge cases and error conditions
- [ ] Tested on different browsers/devices (if applicable)
- [ ] No console errors or warnings

## Code Quality Checklist

### General
- [ ] Code follows project style guidelines
  - Python: PEP 8 compliance
  - TypeScript: ESLint rules followed
- [ ] Self-review completed (read through your own changes)
- [ ] Comments added for complex logic
- [ ] No commented-out code or debug statements
- [ ] No hardcoded values (use config/environment variables)
- [ ] No unused imports or variables
- [ ] Function/variable names are descriptive and clear

### Testing
- [ ] New code has unit tests
- [ ] Existing tests updated if needed
- [ ] Test coverage NOT lowered (no threshold reductions)
- [ ] Tests are reliable (no flaky tests added)
- [ ] Test names clearly describe what is being tested

### Documentation
- [ ] Code comments explain "why", not just "what"
- [ ] Public functions have docstrings/JSDoc comments
- [ ] API documentation updated (if endpoints changed)
- [ ] README updated (if setup/usage changed)
- [ ] Related documentation updated

### Security & Best Practices
- [ ] No sensitive data exposed (API keys, passwords, tokens)
- [ ] Input validation implemented where needed
- [ ] Error handling implemented appropriately
- [ ] No SQL injection vulnerabilities (use parameterized queries)
- [ ] CORS settings appropriate (backend)

## CI/CD Status

<!-- GitHub Actions will automatically run these checks -->

### Required Checks (must pass before merge)
- [ ] E2E Tests - Playwright end-to-end tests
- [ ] Backend Tests - Unit & integration tests with 95%+ coverage
- [ ] Frontend Tests - Jest unit tests with 98%+ coverage

### Before Merging
- [ ] All CI/CD checks are passing (green checkmarks)
- [ ] Branch is up to date with `main`
- [ ] No merge conflicts
- [ ] All review comments addressed

## Screenshots / Demo
<!-- Add screenshots or GIFs if this PR includes UI changes -->



## Breaking Changes
<!-- If this PR includes breaking changes, describe them and migration steps -->



## Deployment Notes
<!-- Any special deployment considerations or steps required? -->



## Checklist for Reviewers
<!-- Guidelines for code reviewers -->
- [ ] Code is clear and maintainable
- [ ] Tests adequately cover the changes
- [ ] Documentation is sufficient
- [ ] No obvious bugs or edge cases missed
- [ ] Performance considerations addressed
- [ ] Security considerations addressed

## Additional Notes
<!-- Any other information that reviewers should know -->



---

## Pre-Commit Checklist Review
<!-- Confirm you followed the pre-commit checklist from the Git workflow -->
I confirm that before committing, I:
- [ ] Ran all tests and they passed
- [ ] Verified coverage meets thresholds (no reductions)
- [ ] Followed code style guidelines
- [ ] Added appropriate comments/documentation
- [ ] Reviewed my own code changes
- [ ] Did NOT use `--no-verify` or `--no-hooks` flags

## Post-Merge Cleanup
<!-- After this PR is merged, don't forget to: -->
- [ ] Delete the feature branch (locally and remotely)
- [ ] Update any related issues
- [ ] Verify changes in the deployed environment (if applicable)

---

**Note to Reviewers**: Before approving, please verify:
1. All automated tests pass
2. Code quality standards are met
3. Documentation is complete
4. No security concerns

**Note to Author**: After approval and merge:
1. Update `main` branch: `git checkout main && git pull origin main`
2. Delete feature branch: `git branch -d feature/your-branch-name`
3. Close related issues if auto-close doesn't work
