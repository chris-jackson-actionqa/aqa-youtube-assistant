# End-to-End Testing Guide

## Overview

This document outlines our comprehensive E2E testing strategy using Playwright for the YouTube Assistant application. E2E tests verify that the entire system (frontend + backend + database) works correctly together from a user's perspective.

## Test Philosophy

Our E2E testing approach is guided by these core principles:

- **Test user workflows, not implementation details** - Focus on what users do and see, not internal code structure
- **Test critical paths that generate business value** - Prioritize the most important user journeys
- **Keep tests independent and isolated** - Each test should be able to run alone without dependencies on other tests
- **Prioritize reliability over coverage** - Better to have fewer reliable tests than many flaky ones
- **Fast feedback** - Full suite should complete in under 5 minutes for quick iteration

## Critical User Workflows

### 1. Project Creation Flow ⭐ **CRITICAL**

**Priority**: Critical  
**Frequency**: Every release  
**Estimated Time**: 30 seconds

**Scenario**: New user creates their first project

**Steps**:
1. Navigate to homepage
2. Click "Create New Project" button
3. Fill in project name and description
4. Submit form
5. Verify project appears in list
6. Verify success message shown
7. Verify form is closed/reset

**Edge Cases**:
- Empty project name (should show validation error)
- Whitespace-only name (should fail validation)
- Duplicate project name (should show error)
- Very long project name (should handle gracefully)
- Special characters in name
- Extremely long description

**Success Criteria**:
- Project is created in database
- Project appears in UI immediately
- Form is reset and ready for next entry
- User receives clear confirmation

---

### 2. Project List and Selection ⭐ **CRITICAL**

**Priority**: Critical  
**Frequency**: Every release  
**Estimated Time**: 20 seconds

**Scenario**: User browses and selects a project to work on

**Steps**:
1. Navigate to homepage with existing projects
2. Verify projects are displayed correctly
3. Click on a project card
4. Verify project is selected (visual indicator)
5. Verify "Working on" header appears with project name
6. Verify selection persists on page reload

**Edge Cases**:
- No projects (empty state with helpful message)
- Many projects (scrolling/performance)
- Project with no description
- Project with long name (truncation)

**Success Criteria**:
- All projects load and display
- Selection state is clear and visible
- Selection persists across page reloads
- Empty state is helpful and actionable

---

### 3. Project Update Flow ⚠️ **HIGH**

**Priority**: High  
**Frequency**: Every release  
**Estimated Time**: 30 seconds

**Scenario**: User updates existing project details

**Steps**:
1. Select a project from the list
2. Click edit button
3. Update name and/or description
4. Save changes
5. Verify updates appear immediately in UI
6. Verify changes persist after reload

**Alternative Flows**:
- Update to duplicate name (should show error)
- Clear description (should be allowed)
- Cancel edit (no changes saved)

**Success Criteria**:
- Changes saved to database
- UI updates immediately
- Validation prevents invalid updates
- Cancel button works correctly

---

### 4. Project Deletion Flow ⭐ **CRITICAL**

**Priority**: Critical  
**Frequency**: Every release  
**Estimated Time**: 25 seconds

**Scenario**: User deletes a project

**Steps**:
1. Navigate to project list
2. Click delete button on a project
3. Verify confirmation modal appears
4. Verify project name shown in modal
5. Confirm deletion
6. Verify project removed from list
7. Verify success message shown

**Alternative Flows**:
- Cancel deletion (project remains)
- Delete selected project (selection cleared)
- Delete last project (show empty state)

**Success Criteria**:
- Confirmation required before deletion
- Project removed from database
- UI updates immediately
- Clear success feedback

---

### 5. Error Handling ⚠️ **HIGH**

**Priority**: High  
**Frequency**: As needed  
**Estimated Time**: Variable

**Scenarios**:
- **API returns 500 error** - Display friendly error message with retry option
- **Network timeout** - Show timeout message, allow retry
- **Invalid form input** - Clear validation messages inline
- **Backend unavailable** - Graceful degradation with helpful message
- **Database constraint violation** - User-friendly error explanation

**Expected Behavior**:
- Clear, non-technical error messages
- Ability to retry failed operations
- No data loss during errors
- Graceful degradation where possible
- Error doesn't crash the application

---

### 6. State Persistence 📋 **NICE TO HAVE**

**Priority**: Medium  
**Frequency**: As needed

**Scenarios**:
- Project selection persists across page reload
- Form data preserved on accidental navigation
- Recently created projects appear immediately
- Deleted projects removed across all views

---

## Test Organization

### Directory Structure

```
e2e/
  tests/
    project-creation.spec.ts       # All project creation tests
    project-management.spec.ts     # List, select, update tests
    project-deletion.spec.ts       # Deletion workflow tests
    error-handling.spec.ts         # Error scenarios
    state-persistence.spec.ts      # State management tests
  fixtures/
    test-data.ts                   # Reusable test data
  helpers/
    test-helpers.ts                # Page Object Model helpers
    api-helpers.ts                 # API testing utilities
  playwright.config.ts             # Playwright configuration
  package.json                     # Dependencies
```

### Naming Conventions

**Test Files**: `{feature}-{action}.spec.ts`
- `project-creation.spec.ts`
- `project-management.spec.ts`
- `error-handling.spec.ts`

**Test Cases**: `should {expected behavior} when {condition}`
- ✅ `should create project when valid name provided`
- ✅ `should show error when creating duplicate project`
- ✅ `should display empty state when no projects exist`

**Test IDs**: `data-testid="{component}-{element}"`
- `data-testid="project-card"`
- `data-testid="delete-button"`
- `data-testid="confirmation-modal"`

---

## Best Practices

### 1. Test Isolation 🔒

**Rule**: Each test must be completely independent

```typescript
test.beforeEach(async ({ page }) => {
  // Clear database before EVERY test
  await setupTest(page);
  await page.goto('/');
});
```

**Why**:
- Tests can run in any order
- Parallel execution is possible
- No hidden dependencies
- Failures are isolated

### 2. Reliable Selectors 🎯

**Preference Order**:
1. **ARIA roles** - `getByRole('button', { name: 'Create' })`
2. **Labels** - `getByLabel('Project Name')`
3. **Text content** - `getByText('No projects yet')`
4. **Test IDs** - `locator('[data-testid="project-card"]')`
5. **Avoid**: CSS classes, IDs that may change

**Why**:
- Role-based selectors mirror user behavior
- More resilient to UI changes
- Better accessibility testing

### 3. Explicit Waits ⏳

**Always wait for specific conditions**:

```typescript
// ✅ GOOD - Wait for specific element
await page.getByText('Project created').waitFor({ state: 'visible' });

// ❌ BAD - Arbitrary timeout
await page.waitForTimeout(1000);
```

**Common wait patterns**:
- `waitFor({ state: 'visible' })` - Element appears
- `waitForLoadState('networkidle')` - Network requests complete
- `waitForResponse()` - Specific API call completes

### 4. Clear Assertions 🎯

**One logical assertion per test**:

```typescript
// ✅ GOOD - One clear assertion
test('should create project', async ({ page }) => {
  await helpers.createProjectViaUI('Test Project');
  await helpers.verifyProjectExists('Test Project');
});

// ❌ BAD - Too many unrelated assertions
test('should do everything', async ({ page }) => {
  // ... tests 5 different things
});
```

**Why**:
- Clear test failures
- Easy to understand what broke
- Faster debugging

### 5. Test Data Management 📦

**Use fixtures for consistency**:

```typescript
import { testProjects, generateUniqueProjectName } from '../fixtures/test-data';

test('should create project', async ({ page }) => {
  const projectName = generateUniqueProjectName('Test');
  await helpers.createProjectViaUI(projectName, testProjects.valid.description);
});
```

**Why**:
- Consistent test data
- Avoid hardcoded values
- Easy to update globally
- Prevents test collisions

### 6. API for Setup, UI for Testing 🚀

**Fast test setup with API**:

```typescript
test('should delete project', async ({ page }) => {
  // ARRANGE - Fast setup via API
  const project = await helpers.createProjectViaAPI('Test Project');
  
  // ACT - Test UI interaction
  await page.goto('/');
  await helpers.deleteProjectViaUI('Test Project');
  
  // ASSERT - Verify result
  await helpers.verifyProjectNotExists('Test Project');
});
```

**Why**:
- Faster test execution
- Focus tests on what matters
- Reduce flakiness

---

## Writing Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';
import { setupTest } from '../helpers/test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await setupTest(page);
    await page.goto('/');
  });

  test('should do something when condition', async ({ page }) => {
    // ARRANGE - Set up test data
    const helpers = new ProjectHelpers(page);
    
    // ACT - Perform user actions
    await helpers.createProjectViaUI('Test Project');
    
    // ASSERT - Verify expected outcome
    await helpers.verifyProjectExists('Test Project');
  });
});
```

### Common Patterns

#### Creating a Project
```typescript
await helpers.createProjectViaUI('Test Project', 'Description');
```

#### Deleting a Project
```typescript
await helpers.deleteProjectViaUI('Test Project');
```

#### Verifying Element Visible
```typescript
await expect(page.locator('[data-testid="project-card"]')).toBeVisible();
```

#### Waiting for API Response
```typescript
await page.waitForResponse(response => 
  response.url().includes('/api/projects') && 
  response.status() === 200
);
```

#### Testing Form Validation
```typescript
// Try to submit empty form
await page.getByRole('button', { name: /create/i }).click();

// Assert validation error shown
await expect(page.getByText(/name is required/i)).toBeVisible();
```

---

## Running Tests

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npx playwright test project-creation.spec.ts

# Run specific test by name
npx playwright test -g "should create project"

# View last HTML report
npm run test:e2e:report
```

### CI/CD

Tests run automatically on:
- ✅ Every pull request
- ✅ Merges to main branch
- ✅ Manual trigger via GitHub Actions

**Configuration**: `.github/workflows/e2e-tests.yml`

---

## Debugging Failed Tests

### 1. Check Test Report 📊

```bash
npm run test:e2e:report
```

Opens HTML report with:
- Test execution timeline
- Screenshots on failure
- Error messages and stack traces

### 2. View Screenshots 📸

**Location**: `e2e/test-results/`

Screenshots captured automatically on:
- Test failure
- First retry
- Manual `page.screenshot()` calls

### 3. Watch Video Recording 🎥

**Location**: `e2e/test-results/**/*.webm`

Videos recorded when:
- Test fails
- Trace is retained

### 4. Run in Debug Mode 🐛

```bash
npm run test:e2e:debug
```

Features:
- Step through test execution
- Inspect element selectors
- Try commands in console
- Pause at any point

### 5. Use Trace Viewer 🔍

```bash
npx playwright show-trace test-results/trace.zip
```

Shows:
- Full timeline of test execution
- Network requests
- Console logs
- DOM snapshots
- Action details

---

## Coverage Goals

### Must Test (Critical Paths) ⭐

These workflows MUST have E2E tests:

- ✅ Create project (happy path)
- ✅ Create project (validation errors)
- ✅ List projects (with data)
- ✅ List projects (empty state)
- ✅ Select project
- ✅ Delete project (with confirmation)
- ✅ Form validation

### Should Test (Important Features) ⚠️

These workflows SHOULD have E2E tests:

- 📋 Update project
- 📋 Project state persistence
- 📋 Error handling (API errors)
- 📋 Cancel operations
- 📋 Multiple projects

### Nice to Test (Enhanced UX) 📋

These are valuable but lower priority:

- 🔮 Dark mode
- 🔮 Keyboard navigation
- 🔮 Mobile responsive
- 🔮 Performance edge cases

---

## Performance Targets

| Metric | Target | Why |
|--------|--------|-----|
| Full suite | < 5 minutes | Fast feedback loop |
| Single test | < 30 seconds | Quick iteration |
| CI pipeline | < 10 minutes | Including setup |
| Test startup | < 30 seconds | Server boot time |

**Optimization Strategies**:
- Use API for test data setup
- Run critical tests first
- Parallel execution where possible
- Minimize page reloads
- Cache browser installations

---

## Maintenance

### When to Update Tests

Update E2E tests when:

1. **New features added** - Add tests for new user workflows
2. **User flows change** - Update tests to match new behavior
3. **UI components refactored** - Update selectors if needed
4. **API endpoints modified** - Update API helper methods
5. **Bugs found** - Add regression test

### Test Health Indicators

**Healthy test suite**:
- ✅ All tests passing consistently
- ✅ Tests complete in under 5 minutes
- ✅ No flaky tests (pass rate > 99%)
- ✅ Clear failure messages
- ✅ Easy to add new tests

**Warning signs**:
- ⚠️ Random failures
- ⚠️ Slow execution
- ⚠️ Unclear error messages
- ⚠️ Difficult to debug

---

## Troubleshooting

### Common Issues

#### Tests Timing Out ⏱️

**Symptoms**: Tests exceed 30 second timeout

**Solutions**:
- Increase timeout in `playwright.config.ts`
- Check if servers are starting properly
- Look for missing `await` keywords
- Check network conditions

```typescript
test.setTimeout(60000); // Increase for specific test
```

#### Database Not Cleaning 🗑️

**Symptoms**: Tests fail due to existing data

**Solutions**:
- Verify `clearDatabase()` helper works
- Check API endpoints are accessible
- Ensure database file has write permissions
- Try manually deleting `test_youtube_assistant.db`

#### Selectors Not Found 🔍

**Symptoms**: `Element not found` errors

**Solutions**:
- Add `data-testid` attributes to components
- Use Playwright Inspector: `npm run test:e2e:debug`
- Check element is actually in the DOM
- Wait for element to appear

```typescript
// Add explicit wait
await page.getByRole('button').waitFor({ state: 'visible' });
```

#### Flaky Tests 🎲

**Symptoms**: Tests pass/fail randomly

**Solutions**:
- Add explicit waits for API responses
- Use `waitForLoadState('networkidle')`
- Check for race conditions
- Avoid `waitForTimeout()`

```typescript
// ✅ GOOD
await page.waitForResponse(r => r.url().includes('/api/projects'));

// ❌ BAD
await page.waitForTimeout(1000);
```

#### Servers Not Starting 🚫

**Symptoms**: Connection refused errors

**Solutions**:
- Check ports 3000 and 8000 are available
- Ensure dependencies installed (backend & frontend)
- Verify Python environment activated
- Check logs in `playwright.config.ts` output

---

## Future Enhancements

### Phase 1 (Near Term)
- 📋 Visual regression testing (screenshot comparison)
- 📋 Accessibility testing (axe-core integration)
- 📋 Performance metrics collection

### Phase 2 (Medium Term)
- 🔮 Cross-browser testing (Firefox, Safari, Edge)
- 🔮 Mobile device testing
- 🔮 API mocking for edge cases
- 🔮 Load testing scenarios

### Phase 3 (Long Term)
- 🔮 Parallel test execution optimization
- 🔮 Test data seeding strategies
- 🔮 Continuous performance monitoring
- 🔮 Automatic flakiness detection

---

## Related Documentation

- **Playwright Documentation**: https://playwright.dev
- **Testing Setup Guide**: `/frontend/docs/TESTING_SETUP.md`
- **Test Automation Agent**: `.github/copilot-prompts/test-automation-agent.md`
- **Issue #19**: Playwright setup and configuration
- **Epic #18**: E2E Testing Infrastructure

---

## Questions or Help

If you need help with E2E testing:

1. **Check this guide first** - Most questions answered here
2. **Review existing tests** - See `e2e/tests/example.spec.ts`
3. **Check Playwright docs** - https://playwright.dev/docs/intro
4. **Ask the team** - Share knowledge and solutions

---

**Last Updated**: October 25, 2025  
**Maintained By**: Project Team  
**Version**: 1.0.0
