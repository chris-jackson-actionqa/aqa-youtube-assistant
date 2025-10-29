# E2E Tests - YouTube Assistant

End-to-end tests for the complete YouTube Assistant application using Playwright.

## Overview

This directory contains E2E tests that verify the entire system (frontend + backend) works correctly together. Tests are written using Playwright and follow best practices for maintainability and reliability.

## Directory Structure

```
e2e/
├── tests/              # Test files (*.spec.ts)
├── fixtures/           # Test data and fixtures
├── helpers/            # Reusable helper functions and Page Objects
├── pages/              # Page Object Models
├── playwright.config.ts # Playwright configuration
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript configuration
```

## Prerequisites

- Node.js 20+ installed
- Backend server running (FastAPI on port 8000)
- Frontend server running (Next.js on port 3000)

**Note:** Playwright config will automatically start both servers before running tests.

## Installation

```bash
cd e2e
npm install
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run specific browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### View last test report
```bash
npm run test:report
```

## Code Quality

### Linting

ESLint is configured with TypeScript and Playwright-specific rules to enforce code quality and best practices.

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

Key linting rules include:
- `playwright/no-wait-for-timeout` - Prevents brittle waits
- `playwright/no-force-option` - Discourages force clicks that bypass actionability checks
- `playwright/no-networkidle` - Warns against using networkidle (use specific waits instead)
- `playwright/expect-expect` - Ensures tests have assertions
- TypeScript strict mode with proper type checking

### Formatting

Prettier is configured for consistent code formatting across all test files.

```bash
# Check formatting
npm run format:check

# Apply formatting
npm run format
```

### Type Checking

TypeScript type checking ensures type safety across all test files.

```bash
# Run type checking
npm run type-check
```

### Pre-commit Workflow

Before committing changes, run:
```bash
npm run lint:fix    # Fix linting issues
npm run format      # Format code
npm run type-check  # Verify types
npm test            # Run tests
```

### VSCode Integration

The `.vscode/settings.json` is configured to:
- Auto-format on save with Prettier
- Auto-fix ESLint issues on save
- Validate TypeScript as you type

Make sure you have the following VSCode extensions installed:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { setupTest } from '../helpers/test-helpers';
import { createTestProject } from '../fixtures/test-data';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup and clear database
    await setupTest(page);
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/');
    
    // Act
    await page.getByLabel('Project Name').fill('Test');
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Assert
    await expect(page.getByText('Test')).toBeVisible();
  });
});
```

### Using Helper Functions

```typescript
import { ProjectHelpers } from '../helpers/test-helpers';

test('create project via helper', async ({ page }) => {
  const helpers = new ProjectHelpers(page);
  
  // Fast API-based setup
  await helpers.createProjectViaAPI('Test Project', 'Description');
  
  // Then test UI behavior
  await helpers.goToHomePage();
  await helpers.verifyProjectExists('Test Project');
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent and clean up after itself
2. **Use Page Objects**: Encapsulate UI interactions in helper classes
3. **Accessible Selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
4. **Avoid Flakiness**: Use proper waits (`waitForSelector`) instead of arbitrary timeouts
5. **API for Setup**: Use API calls for test data setup, UI for actual testing
6. **Clear Test Names**: Use descriptive test names that explain what is being tested

## Debugging

### Take Screenshots
```typescript
await page.screenshot({ path: 'debug.png' });
```

### Pause Execution
```typescript
await page.pause();
```

### View Trace
When a test fails, Playwright automatically captures a trace. View it with:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## CI/CD Integration

Tests are configured to run in CI with:
- Retries: 2 attempts per test
- Workers: 1 (sequential execution for stability)
- Artifacts: Screenshots, videos, and traces on failure

## Troubleshooting

### Servers not starting
- Ensure backend dependencies are installed: `cd backend && pip install -r requirements.txt`
- Ensure frontend dependencies are installed: `cd frontend && npm install`
- Check ports 3000 and 8000 are not already in use

### Tests failing randomly
- Increase timeouts in `playwright.config.ts`
- Check for race conditions in tests
- Ensure proper use of `waitForSelector` instead of `waitForTimeout`

### Browser not launching
- Run `npx playwright install` again
- Run `npx playwright install-deps` for system dependencies

## Related Documentation

- **[E2E Testing Guide](../frontend/docs/E2E_TESTING_GUIDE.md)** - Comprehensive testing strategy and best practices
- **[Test Case Inventory](./TEST_CASES.md)** - Complete catalog of all test cases
- [Playwright Documentation](https://playwright.dev/)
- [Test Automation Agent Prompt](../.github/copilot-prompts/test-automation-agent.md)
- [Issue #19 - E2E Setup](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/19)
- [Issue #20 - E2E Test Plan](https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/20)
