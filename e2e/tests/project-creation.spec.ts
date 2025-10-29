/**
 * E2E Tests: Project Creation Workflow
 *
 * Comprehensive tests for the project creation user workflow, covering:
 * - Happy paths (successful creation)
 * - Validation (empty names, whitespace)
 * - Duplicate detection (case-insensitive)
 * - Edge cases (long names, special characters)
 * - Form interactions (cancel, loading states)
 * - Error handling (API errors, network timeouts)
 *
 * Related: Issue #21
 * Epic: Issue #18 - E2E Testing Infrastructure
 */

import { test, expect } from '@playwright/test';
import { setupTest, ProjectHelpers } from '../helpers/test-helpers';
import { generateUniqueProjectName } from '../fixtures/test-data';

test.describe('Project Creation Workflow', () => {
  let helpers: ProjectHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = await setupTest(page);
    await page.goto('/');
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState('networkidle');
  });

  test.describe('Happy Paths', () => {
    test('should create a new project with name and description', async ({ page }) => {
      // Arrange
      const projectName = generateUniqueProjectName('My First Video');
      const projectDescription = 'A tutorial about TypeScript';

      // Act: Create project using helper
      await helpers.createProjectViaUI(projectName, projectDescription);

      // Assert: Project appears in list
      await helpers.verifyProjectExists(projectName);

      // Assert: Success message shown (if implemented)
      // Note: Uncomment when success message is implemented
      // await expect(page.locator('text=Project created successfully')).toBeVisible();

      // Assert: Form is closed/reset (button visible means form is closed)
      await expect(page.getByRole('button', { name: /create new project/i })).toBeVisible();
    });

    // eslint-disable-next-line playwright/expect-expect
    test('should create project with only name (no description)', async ({ page }) => {
      // Arrange
      const projectName = generateUniqueProjectName('Minimal Project');

      // Act
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/project name/i).fill(projectName);
      await page.getByRole('button', { name: /create project/i }).click();

      // Assert
      await helpers.verifyProjectExists(projectName);
    });

    test('should show empty state and transition to project list after first creation', async ({
      page,
    }) => {
      // Arrange - verify empty state
      await expect(page.getByText(/create your first project/i)).toBeVisible();
      await expect(page.getByText('No projects yet')).toBeVisible();

      // Act - create first project
      const projectName = generateUniqueProjectName('First Project');
      await helpers.createProjectViaUI(projectName);

      // Assert - empty state should be gone
      await expect(page.getByText(/create your first project/i)).toBeHidden();
      await helpers.verifyProjectExists(projectName);
    });

    test('should allow creating multiple projects sequentially', async ({ page }) => {
      // Arrange
      const project1 = generateUniqueProjectName('Project 1');
      const project2 = generateUniqueProjectName('Project 2');
      const project3 = generateUniqueProjectName('Project 3');

      // Act - create three projects
      await helpers.createProjectViaUI(project1);
      await helpers.createProjectViaUI(project2);
      await helpers.createProjectViaUI(project3);

      // Assert - all should be visible
      await helpers.verifyProjectExists(project1);
      await helpers.verifyProjectExists(project2);
      await helpers.verifyProjectExists(project3);

      // Assert - count should be 3
      const projectCards = page.locator('[data-testid="project-card"]');
      await expect(projectCards).toHaveCount(3);
    });
  });

  test.describe('Validation', () => {
    test('should show validation error for empty project name', async ({ page }) => {
      // Act
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });

      // Try to submit without filling (button should be disabled)
      const submitButton = page.getByRole('button', { name: /create project/i });

      // Assert: Submit button should be disabled when name is empty
      await expect(submitButton).toBeDisabled();

      // Assert: No project created
      const projectCards = page.locator('[data-testid="project-card"]');
      await expect(projectCards).toHaveCount(0);
    });

    test('should reject whitespace-only project name', async ({ page }) => {
      // Act
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/project name/i).fill('     ');

      const submitButton = page.getByRole('button', { name: /create project/i });

      // Assert: Submit button should be disabled for whitespace-only input
      await expect(submitButton).toBeDisabled();
    });

    // TODO: Unskip when project creation UI handles very long names properly (#39)
    test('should handle very long project names', async ({ page }) => {
      // Arrange - create a long name (255 characters)
      const longName = generateUniqueProjectName('A'.repeat(200));

      // Act
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/project name/i).fill(longName);
      await page.getByRole('button', { name: /create project/i }).click();

      // Assert - verify it's created (checking first 50 chars for visibility)
      await expect(page.getByText(longName.substring(0, 50))).toBeVisible();
    });

    // TODO: Unskip when project creation UI handles special characters (#39)
    // eslint-disable-next-line playwright/expect-expect
    test('should handle special characters in project name', async () => {
      // Arrange
      const specialName = generateUniqueProjectName('Project #1: "TypeScript"');

      // Act
      await helpers.createProjectViaUI(specialName);

      // Assert
      await helpers.verifyProjectExists(specialName);
    });
  });

  test.describe('Duplicate Detection', () => {
    // TODO: Unskip when duplicate detection UI error messages are implemented (#38)
    test('should show error when creating project with duplicate name', async ({ page }) => {
      // Arrange - create first project
      const projectName = generateUniqueProjectName('Duplicate Test');
      await helpers.createProjectViaUI(projectName);

      // Act - try to create duplicate
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/project name/i).fill(projectName);
      await page.getByRole('button', { name: /create project/i }).click();

      // Assert: Error message shown (look for error text related to duplicate)
      await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 5000 });

      // Assert: Only one project in list
      const projectCards = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: projectName });
      await expect(projectCards).toHaveCount(1);
    });

    // TODO: Unskip when case-insensitive duplicate detection is implemented (#38)
    test('should detect duplicate names case-insensitively', async ({ page }) => {
      // Arrange - create project with original case
      const originalName = generateUniqueProjectName('Test Project');
      await helpers.createProjectViaUI(originalName);

      // Act - try different case
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/project name/i).fill(originalName.toLowerCase());
      await page.getByRole('button', { name: /create project/i }).click();

      // Assert: Error message about duplicate
      await expect(page.getByText(/already exists/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Form Interactions', () => {
    test('should close form without creating project when cancelled', async ({ page }) => {
      // Arrange
      const cancelledName = generateUniqueProjectName('Cancelled Project');

      // Act
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/project name/i).fill(cancelledName);
      await page.getByRole('button', { name: /cancel/i }).click();

      // Assert - form should be closed
      await expect(page.getByLabel(/project name/i)).toBeHidden();

      // Assert - project should not exist
      await expect(page.getByText(cancelledName)).toBeHidden();
    });

    // Phase 2: Loading state test
    // ✅ PASSING - Loading state already implemented
    test('should show loading state during project creation', async ({ page }) => {
      // Arrange
      const projectName = generateUniqueProjectName('Loading Test');

      // Act
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/project name/i).fill(projectName);

      // Click submit and check for loading indicator
      const submitButton = page.getByRole('button', { name: /create project/i });
      await submitButton.click();

      // Assert: Button should be disabled during loading
      // Note: This assumes the button gets disabled during submission
      // If there's a specific loading spinner, check for that instead
      await expect(submitButton).toBeDisabled();

      // Wait for completion
      await helpers.verifyProjectExists(projectName);

      // Loading should be complete (button re-enabled on form close)
      await expect(page.getByRole('button', { name: /create new project/i })).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    // TODO: Unskip when project creation UI is fully implemented (#12, #15, #39)
    test('should handle rapid form submissions', async ({ page }) => {
      // Arrange
      const projectName = generateUniqueProjectName('Rapid Submit Test');

      // Act - fill form and try to submit multiple times rapidly
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/project name/i).fill(projectName);

      const submitButton = page.getByRole('button', { name: /create project/i });

      // Click submit multiple times in rapid succession
      await submitButton.click();
      await submitButton.click().catch(() => {}); // May already be processing
      await submitButton.click().catch(() => {}); // May already be processing

      // Assert: Only one project should be created
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(1000); // Wait for any duplicate requests to complete

      const projectCards = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: projectName });
      await expect(projectCards).toHaveCount(1);
    });

    test('should persist form data when validation fails', async ({ page }) => {
      // Arrange
      const description = 'This description should persist after validation failure';

      // Act - fill description but leave name empty
      await page.getByRole('button', { name: /create new project/i }).click();
      await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
      await page.getByLabel(/description/i).fill(description);

      // Try to submit (should fail validation)
      const submitButton = page.getByRole('button', { name: /create project/i });
      await expect(submitButton).toBeDisabled();

      // Assert: Description should still be there
      await expect(page.getByLabel(/description/i)).toHaveValue(description);
    });

    // TODO: Unskip when project creation UI handles emoji (#39)
    test('should handle projects with emoji in name', async ({ page }) => {
      // Arrange
      const emojiName = generateUniqueProjectName('🎬 Video Project 🎥');

      // Act
      await helpers.createProjectViaUI(emojiName);

      // Assert
      await expect(page.getByText('🎬 Video Project 🎥')).toBeVisible();
    });
  });
});
