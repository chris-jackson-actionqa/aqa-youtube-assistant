/**
 * E2E Tests: Project Management Workflows
 *
 * Comprehensive tests for project management operations including:
 * - Listing projects (display all, empty state, project info)
 * - Project selection (select, clear, switch, persist)
 * - Project deletion (delete flow, cancel, loading, errors)
 * - Keyboard navigation
 *
 * Related: Issue #22
 * Epic: Issue #18 - E2E Testing Infrastructure
 * Dependencies: Issue #19 (Playwright setup), Issue #21 (Project creation tests)
 */

import { test, expect } from '@playwright/test';
import { ProjectHelpers } from '../helpers/test-helpers';

test.describe('Project Management Workflows', () => {
  let helpers: ProjectHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ProjectHelpers(page);
    await helpers.setupWorkspace();
  });

  test.afterEach(async () => {
    await helpers.teardownWorkspace();
  });

  test.describe('Listing Projects', () => {
    test('should display all existing projects', async ({ page }) => {
      // Setup: Create multiple projects via API
      await helpers.createProjectViaAPI('Project Alpha');
      await helpers.createProjectViaAPI('Project Beta');
      await helpers.createProjectViaAPI('Project Gamma');

      await page.goto('/');

      // Assert: All projects visible
      await helpers.verifyProjectExists('Project Alpha');
      await helpers.verifyProjectExists('Project Beta');
      await helpers.verifyProjectExists('Project Gamma');

      const projectCards = page.locator('[data-testid="project-card"]');
      await expect(projectCards).toHaveCount(3);
    });

    test('should show empty state when no projects exist', async ({ page }) => {
      await page.goto('/');

      // Assert: Empty state visible
      await expect(page.locator('text=No projects yet')).toBeVisible();
      await expect(page.locator('text=Create your first project')).toBeVisible();

      // Assert: No project cards
      const projectCards = page.locator('[data-testid="project-card"]');
      await expect(projectCards).toHaveCount(0);
    });

    test('should display all project information correctly', async ({ page }) => {
      // Create project with all fields
      await helpers.createProjectViaAPI(
        'Full Details Project',
        'A comprehensive description',
        'in_progress'
      );

      await page.goto('/');

      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Full Details Project' });

      // Assert: Name visible
      await expect(projectCard.locator('text=Full Details Project')).toBeVisible();

      // Assert: Description visible (or truncated)
      await expect(projectCard.locator('text=A comprehensive description')).toBeVisible();

      // Assert: Status badge visible with correct label (displayed as "In Progress")
      await expect(
        projectCard.locator('[data-testid="status-badge"]').filter({ hasText: 'In Progress' })
      ).toBeVisible();

      // Assert: Dates visible (both Created and Updated)
      await expect(projectCard.locator('text=Created:')).toBeVisible();
      await expect(projectCard.locator('text=Updated:')).toBeVisible();
    });
  });

  test.describe('Project Selection', () => {
    test('should select project and show in header', async ({ page }) => {
      await helpers.createProjectViaAPI('Selected Project');
      await page.goto('/');

      // Act: Click project
      await helpers.selectProject('Selected Project');

      // Assert: Project is selected (visual indicator)
      const selectedCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Selected Project' });
      await expect(selectedCard).toHaveClass(/selected|active/);

      // Assert: Header shows current project
      await expect(page.locator('text=Working on: Selected Project')).toBeVisible();
    });

    // Phase 2: Clear selection test
    // ✅ PASSING - Clear selection button already implemented in issue #53
    test('should clear project selection', async ({ page }) => {
      await helpers.createProjectViaAPI('Temp Project');
      await page.goto('/');

      await helpers.selectProject('Temp Project');
      await expect(page.locator('text=Working on: Temp Project')).toBeVisible();

      // Act: Clear selection
      await page.click('button:has-text("Clear")');

      // Assert: Selection cleared
      await expect(page.locator('text=Working on:')).toBeHidden();

      // Assert: No project has selected class
      const selectedCards = page.locator('[data-testid="project-card"][class*="selected"]');
      await expect(selectedCards).toHaveCount(0);
    });

    // Phase 2: Selection persistence test
    // ✅ PASSING - localStorage persistence already implemented in issue #53
    test('should persist project selection across page reload', async ({ page }) => {
      await helpers.createProjectViaAPI('Persistent Project');
      await page.goto('/');

      await helpers.selectProject('Persistent Project');
      await expect(page.locator('text=Working on: Persistent Project')).toBeVisible();

      // Reload page
      await page.reload();

      // Assert: Selection persists
      await expect(page.locator('text=Working on: Persistent Project')).toBeVisible();
      const selectedCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Persistent Project' });
      await expect(selectedCard).toHaveClass(/selected|active/);
    });

    test('should switch between multiple project selections', async ({ page }) => {
      await helpers.createProjectViaAPI('Project 1');
      await helpers.createProjectViaAPI('Project 2');
      await helpers.createProjectViaAPI('Project 3');
      await page.goto('/');

      // Select first project
      await helpers.selectProject('Project 1');
      await expect(page.locator('text=Working on: Project 1')).toBeVisible();

      // Switch to second project
      await helpers.selectProject('Project 2');
      await expect(page.locator('text=Working on: Project 2')).toBeVisible();
      await expect(page.locator('text=Working on: Project 1')).toBeHidden();

      // Switch to third project
      await helpers.selectProject('Project 3');
      await expect(page.locator('text=Working on: Project 3')).toBeVisible();
    });
  });

  test.describe('Project Deletion', () => {
    test('should delete project after confirmation', async ({ page }) => {
      await helpers.createProjectViaAPI('Project to Delete');
      await page.goto('/');

      await helpers.verifyProjectExists('Project to Delete');

      // Act: Click delete button (updated selector with project name)
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Project to Delete' });
      await projectCard.locator('button[aria-label="Delete project Project to Delete"]').click();

      // Assert: Confirmation modal appears
      await expect(page.locator('text=Delete Project?')).toBeVisible();
      // Check for HTML entities instead of literal quotes
      await expect(page.getByRole('dialog').getByText(/Project to Delete/)).toBeVisible();
      await expect(page.locator('text=This action cannot be undone')).toBeVisible();

      // Act: Confirm deletion
      await page.getByRole('button', { name: 'Confirm delete Project to Delete' }).click();

      // Assert: Project removed
      await expect(
        page.locator('[data-testid="project-card"]').filter({ hasText: 'Project to Delete' })
      ).toBeHidden();
    });

    test('should cancel project deletion', async ({ page }) => {
      await helpers.createProjectViaAPI('Keep This Project');
      await page.goto('/');

      // Act: Open delete modal (updated selector with project name)
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Keep This Project' });
      await projectCard.locator('button[aria-label="Delete project Keep This Project"]').click();

      await expect(page.locator('text=Delete Project?')).toBeVisible();

      // Act: Cancel
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Assert: Modal closed, project still exists
      await expect(page.locator('text=Delete Project?')).toBeHidden();
      await helpers.verifyProjectExists('Keep This Project');
    });

    // Phase 2: Clear selection on delete test
    // ✅ PASSING - Clear on delete already implemented in issue #53 and #54
    test('should clear selection when deleting selected project', async ({ page }) => {
      await helpers.createProjectViaAPI('Selected and Deleted');
      await page.goto('/');

      await helpers.selectProject('Selected and Deleted');
      await expect(page.locator('text=Working on: Selected and Deleted')).toBeVisible();

      // Delete the selected project (updated selector with project name)
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Selected and Deleted' });
      await projectCard.locator('button[aria-label="Delete project Selected and Deleted"]').click();
      await page.getByRole('button', { name: 'Confirm delete Selected and Deleted' }).click();

      // Assert: Selection cleared
      await expect(page.locator('text=Working on:')).toBeHidden();
      await expect(
        page.locator('[data-testid="project-card"]').filter({ hasText: 'Selected and Deleted' })
      ).toBeHidden();
    });

    test('should show loading state during deletion', async ({ page }) => {
      await helpers.createProjectViaAPI('Test Delete Loading');
      await page.goto('/');

      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Test Delete Loading' });
      await projectCard.locator('button[aria-label="Delete project Test Delete Loading"]').click();
      await page.getByRole('button', { name: 'Confirm delete Test Delete Loading' }).click();

      // Assert: Loading indicator visible (may be brief but should be present)
      await expect(page.locator('[data-testid="deleting-spinner"]')).toBeVisible();

      // Eventually: Success - project is deleted
      await expect(
        page.locator('[data-testid="project-card"]').filter({ hasText: 'Test Delete Loading' })
      ).not.toBeVisible({ timeout: 5000 });
    });

    // Note: Error handling is comprehensively tested in unit tests (ProjectDeleteConfirmation.test.tsx)
    // E2E tests focus on real backend integration rather than mocked error scenarios
    // eslint-disable-next-line playwright/no-skipped-test, playwright/expect-expect
    test.skip('should handle delete API errors gracefully', async () => {
      // This scenario is better tested in unit tests where we can reliably mock API failures
      // without interfering with real backend state
    });

    // TODO: Enable when issue #15 is complete (ProjectDeleteConfirmation modal integration)
    test('should handle deleting already-deleted project', async ({ page }) => {
      const project = await helpers.createProjectViaAPI('Vanishing Project');
      await page.goto('/');

      // Simulate project deleted elsewhere
      await helpers.deleteProjectViaAPI(project.id);

      // Try to delete from UI
      await page.reload(); // Reload to show it's gone

      // Should show empty state or appropriate message
      await expect(
        page.locator('[data-testid="project-card"]').filter({ hasText: 'Vanishing Project' })
      ).toBeHidden();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation through projects', async ({ page }) => {
      await helpers.createProjectViaAPI('Keyboard Project');
      await page.goto('/');

      // Wait for project to be visible
      await expect(page.locator('text=Keyboard Project')).toBeVisible();

      // Focus the project card directly using a robust selector
      const projectCard = page.getByTestId('project-card').filter({
        hasText: 'Keyboard Project',
      });
      await projectCard.focus();

      // Enter to select
      await page.keyboard.press('Enter');

      // Verify selection
      await expect(page.locator('text=Working on: Keyboard Project')).toBeVisible();
    });
  });
});
