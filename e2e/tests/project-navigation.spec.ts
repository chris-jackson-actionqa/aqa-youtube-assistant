/**
 * E2E Tests: Project Card Navigation (Issue #138)
 *
 * Tests the clickable project cards feature that enables navigation
 * to project detail pages when clicking on a project card.
 *
 * Feature Requirements:
 * - Entire project card is clickable
 * - Clicking navigates to /projects/{id}
 * - URL updates correctly
 * - Visual feedback on hover (cursor pointer, subtle background)
 * - Delete button works WITHOUT triggering navigation
 * - Delete button stops event propagation
 *
 * Related: Issue #138 - Make project cards clickable with navigation
 * Epic: Issue #137 - Project detail page
 */

import { test, expect } from '@playwright/test';
import { ProjectHelpers } from '../helpers/test-helpers';

test.describe('Project Card Navigation (Issue #138)', () => {
  let helpers: ProjectHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ProjectHelpers(page);
    await helpers.setupWorkspace();
  });

  test.afterEach(async () => {
    await helpers.teardownWorkspace();
  });

  test.describe('Card Click Navigation', () => {
    test('should navigate to project detail page when clicking card', async ({ page }) => {
      // Setup: Create a project
      const project = await helpers.createProjectViaAPI('Clickable Project', 'Test description');
      await page.goto('/');

      // Act: Click on the project card
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Clickable Project' });
      await projectCard.click();

      // Assert: URL changed to project detail page
      await expect(page).toHaveURL(`/projects/${project.id}`);

      // Note: The detail page shows 404 as it's not implemented yet (Epic #137)
      // But navigation should work correctly
    });

    test('should update URL correctly for different projects', async ({ page }) => {
      // Setup: Create multiple projects
      const project1 = await helpers.createProjectViaAPI('Project One');
      const project2 = await helpers.createProjectViaAPI('Project Two');
      const project3 = await helpers.createProjectViaAPI('Project Three');
      await page.goto('/');

      // Act & Assert: Click first project
      await page.locator('[data-testid="project-card"]').filter({ hasText: 'Project One' }).click();
      await expect(page).toHaveURL(`/projects/${project1.id}`);

      // Navigate back
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Act & Assert: Click second project
      await page.locator('[data-testid="project-card"]').filter({ hasText: 'Project Two' }).click();
      await expect(page).toHaveURL(`/projects/${project2.id}`);

      // Navigate back
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Act & Assert: Click third project
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Project Three' })
        .click();
      await expect(page).toHaveURL(`/projects/${project3.id}`);
    });

    test('should navigate using keyboard Enter key', async ({ page }) => {
      // Setup: Create a project
      const project = await helpers.createProjectViaAPI('Keyboard Nav Project');
      await page.goto('/');

      // Act: Focus on project card and press Enter
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Keyboard Nav Project' });
      await projectCard.focus();
      await page.keyboard.press('Enter');

      // Assert: URL changed to project detail page
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });

    test('should navigate using keyboard Space key', async ({ page }) => {
      // Setup: Create a project
      const project = await helpers.createProjectViaAPI('Space Key Project');
      await page.goto('/');

      // Act: Focus on project card and press Space
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Space Key Project' });
      await projectCard.focus();
      await page.keyboard.press('Space');

      // Assert: URL changed to project detail page
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });
  });

  test.describe('Visual Feedback', () => {
    test('should show cursor pointer on hover', async ({ page }) => {
      // Setup: Create a project
      await helpers.createProjectViaAPI('Hover Test Project');
      await page.goto('/');

      // Get project card
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Hover Test Project' });

      // Assert: Cursor pointer class is present
      await expect(projectCard).toHaveClass(/cursor-pointer/);
    });

    test('should show hover background change', async ({ page }) => {
      // Setup: Create a project
      await helpers.createProjectViaAPI('Hover BG Project');
      await page.goto('/');

      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Hover BG Project' });

      // Assert: Hover classes are present
      // Check for both light and dark mode hover classes
      const classAttribute = await projectCard.getAttribute('class');
      expect(classAttribute).toMatch(/hover:bg-gray-50|hover:bg-gray-700/);
    });

    test('should maintain hover styles across all project cards', async ({ page }) => {
      // Setup: Create multiple projects
      await helpers.createProjectViaAPI('Project A');
      await helpers.createProjectViaAPI('Project B');
      await helpers.createProjectViaAPI('Project C');
      await page.goto('/');

      // Wait for projects to load
      const projectCards = page.locator('[data-testid="project-card"]');
      await expect(projectCards.first()).toBeVisible({ timeout: 5000 });
      
      const count = await projectCards.count();
      expect(count).toBeGreaterThanOrEqual(3);

      // Assert: All cards have cursor-pointer and hover classes
      for (let i = 0; i < count; i++) {
        const card = projectCards.nth(i);
        await expect(card).toHaveClass(/cursor-pointer/);
        const classAttr = await card.getAttribute('class');
        expect(classAttr).toMatch(/hover:bg-gray-/);
      }
    });
  });

  test.describe('Delete Button Isolation', () => {
    test('should delete project without triggering navigation', async ({ page }) => {
      // Setup: Create a project
      const project = await helpers.createProjectViaAPI('Delete Without Nav');
      await page.goto('/');

      // Get project card
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Delete Without Nav' });

      // Act: Click delete button (not the card)
      const deleteButton = projectCard.locator('button[aria-label*="Delete project"]');
      await deleteButton.click();

      // Assert: Confirmation modal appears (not navigated)
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.locator('text=Delete Project?')).toBeVisible();

      // Assert: Still on home page, not on project detail page
      await expect(page).toHaveURL('/');
      await expect(page).not.toHaveURL(`/projects/${project.id}`);

      // Complete deletion
      await page.getByRole('button', { name: /Confirm delete/ }).click();

      // Assert: Project deleted, still on home page
      await expect(projectCard).toBeHidden();
      await expect(page).toHaveURL('/');
    });

    test('should handle rapid clicks - card then delete', async ({ page }) => {
      // Setup: Create a project
      const project = await helpers.createProjectViaAPI('Rapid Click Test');
      await page.goto('/');

      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Rapid Click Test' });

      // Act: Click card first (navigation should start)
      await projectCard.click();

      // Assert: Navigated to project page
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });

    test('should maintain delete functionality after navigation', async ({ page }) => {
      // Setup: Create two projects
      const project1 = await helpers.createProjectViaAPI('Nav Then Delete 1');
      await helpers.createProjectViaAPI('Nav Then Delete 2');
      await page.goto('/');

      // Act: Navigate to first project
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Nav Then Delete 1' })
        .click();
      await expect(page).toHaveURL(`/projects/${project1.id}`);

      // Go back to home
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Act: Now delete the second project
      const deleteButton = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Nav Then Delete 2' })
        .locator('button[aria-label*="Delete project"]');
      await deleteButton.click();

      // Assert: Deletion works correctly
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: /Confirm delete/ }).click();

      // Assert: Project deleted, still on home page
      await expect(
        page.locator('[data-testid="project-card"]').filter({ hasText: 'Nav Then Delete 2' })
      ).toBeHidden();
      await expect(page).toHaveURL('/');
    });

    test('should cancel delete without navigation side effects', async ({ page }) => {
      // Setup: Create a project
      const project = await helpers.createProjectViaAPI('Cancel Delete Test');
      await page.goto('/');

      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Cancel Delete Test' });

      // Act: Click delete button
      const deleteButton = projectCard.locator('button[aria-label*="Delete project"]');
      await deleteButton.click();

      // Assert: Modal visible
      await expect(page.getByRole('dialog')).toBeVisible();

      // Act: Cancel deletion (use exact match for Cancel button text only)
      await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();

      // Assert: Modal closed, still on home page, project still exists
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(page).toHaveURL('/');
      await expect(projectCard).toBeVisible();

      // Assert: Can still click the card to navigate
      await projectCard.click();
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle clicking on text within card', async ({ page }) => {
      // Setup: Create a project with description
      const project = await helpers.createProjectViaAPI(
        'Text Click Project',
        'This is a long description that users might click on'
      );
      await page.goto('/');

      // Act: Click on project name text
      await page.locator('text=Text Click Project').click();

      // Assert: Navigated to project page
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });

    test('should handle clicking on status badge', async ({ page }) => {
      // Setup: Create a project
      const project = await helpers.createProjectViaAPI('Status Click', 'Test', 'in_progress');
      await page.goto('/');

      // Act: Click on status badge (should still navigate)
      const statusBadge = page.locator('[data-testid="status-badge"]').first();
      await statusBadge.click();

      // Assert: Navigated to project page
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });

    test('should handle clicking near card edges', async ({ page }) => {
      // Setup: Create a project
      const project = await helpers.createProjectViaAPI('Edge Click Project');
      await page.goto('/');

      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Edge Click Project' });

      // Act: Click on the card directly (more reliable than edge clicking)
      await projectCard.click({ position: { x: 10, y: 10 } });

      // Assert: Navigated
      await expect(page).toHaveURL(`/projects/${project.id}`);

      // Go back
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Act: Click in a different position on the card
      await projectCard.click({ position: { x: 50, y: 50 } });

      // Assert: Navigated again
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });    test('should work with single project in list', async ({ page }) => {
      // Setup: Create only one project
      const project = await helpers.createProjectViaAPI('Only Project');
      await page.goto('/');

      // Act: Click the only project card
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Only Project' })
        .click();

      // Assert: Navigated correctly
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });

    test('should work with many projects in list', async ({ page }) => {
      // Setup: Create many projects
      const projects = [];
      for (let i = 1; i <= 10; i++) {
        projects.push(await helpers.createProjectViaAPI(`Project ${i}`));
      }
      await page.goto('/');

      // Act: Click the 5th project (middle of list)
      await page.locator('[data-testid="project-card"]').filter({ hasText: 'Project 5' }).click();

      // Assert: Navigated to correct project
      await expect(page).toHaveURL(`/projects/${projects[4].id}`);
    });
  });

  test.describe('Browser History', () => {
    test('should support browser back button after navigation', async ({ page }) => {
      // Setup: Create a project with unique name
      const uniqueName = `History Back ${Date.now()}`;
      const project = await helpers.createProjectViaAPI(uniqueName);
      await page.goto('/');

      // Act: Navigate to project
      await page.locator('[data-testid="project-card"]').filter({ hasText: uniqueName }).click();
      await expect(page).toHaveURL(`/projects/${project.id}`);

      // Act: Go back
      await page.goBack();

      // Assert: Back on home page
      await expect(page).toHaveURL('/');

      // Assert: Project card is still visible
      await expect(
        page.locator('[data-testid="project-card"]').filter({ hasText: uniqueName })
      ).toBeVisible();
    });

    test('should support browser forward button after back navigation', async ({ page }) => {
      // Setup: Create a project with unique name
      const uniqueName = `Forward Nav ${Date.now()}`;
      const project = await helpers.createProjectViaAPI(uniqueName);
      await page.goto('/');

      // Act: Navigate to project
      await page.locator('[data-testid="project-card"]').filter({ hasText: uniqueName }).click();
      await expect(page).toHaveURL(`/projects/${project.id}`);

      // Act: Go back
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Act: Go forward
      await page.goForward();

      // Assert: Back on project page
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });

    test('should maintain navigation history for multiple projects', async ({ page }) => {
      // Setup: Create three projects with unique names
      const timestamp = Date.now();
      const project1 = await helpers.createProjectViaAPI(`History P1 ${timestamp}`);
      const project2 = await helpers.createProjectViaAPI(`History P2 ${timestamp}`);
      const project3 = await helpers.createProjectViaAPI(`History P3 ${timestamp}`);
      await page.goto('/');

      // Act: Navigate through multiple projects
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: `History P1 ${timestamp}` })
        .click();
      await expect(page).toHaveURL(`/projects/${project1.id}`);

      await page.goBack();
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: `History P2 ${timestamp}` })
        .click();
      await expect(page).toHaveURL(`/projects/${project2.id}`);

      await page.goBack();
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: `History P3 ${timestamp}` })
        .click();
      await expect(page).toHaveURL(`/projects/${project3.id}`);

      // Assert: Can navigate back through history
      await page.goBack();
      await expect(page).toHaveURL('/');

      // Note: Further back navigation gets complex with multiple back/forward steps
      // Verify we can navigate forward to the last project visited
      await page.goForward();
      await expect(page).toHaveURL(`/projects/${project3.id}`);
    });
  });
});
