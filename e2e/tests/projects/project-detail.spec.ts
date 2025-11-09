/**
 * E2E Tests: Project Detail Page
 *
 * Tests for the project detail page route, focusing on:
 * - 404 handling for non-existent projects
 * - Custom 404 page rendering and navigation
 * - Accessibility of 404 page
 *
 * Note: Full detail page rendering tests with project data are limited due to
 * SSR workspace context limitations. The SSR page defaults to workspace 1 while
 * E2E tests use isolated workspaces. This is a known limitation to be addressed.
 *
 * Related: Issue #139
 * Feature: Dynamic route /projects/[id] with server-side rendering
 */

import { test, expect } from '@playwright/test';
import { ProjectHelpers } from '../../helpers/test-helpers';

test.describe('Project Detail Page', () => {
  let helpers: ProjectHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ProjectHelpers(page);
    await helpers.setupWorkspace();
  });

  test.afterEach(async () => {
    await helpers.teardownWorkspace();
  });

  test.describe('404 Error Handling', () => {
    test('should show custom 404 page for non-existent project ID', async ({ page }) => {
      // Act: Navigate to non-existent project
      await page.goto('/projects/999999');

      // Assert: Custom 404 page is displayed
      await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Project Not Found', level: 2 })
      ).toBeVisible();

      // Assert: Error message is displayed
      await expect(page.getByText(/the project you're looking for doesn't exist/i)).toBeVisible();

      // Assert: Back to Projects link is present
      const backLink = page.getByRole('link', { name: /back to projects/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/projects');
    });

    test('should show 404 for invalid project ID format', async ({ page }) => {
      // Act: Navigate with invalid ID (non-numeric)
      await page.goto('/projects/invalid-id');

      // Assert: 404 page is shown
      await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Project Not Found', level: 2 })
      ).toBeVisible();
    });

    test('should navigate back to projects list from 404 page', async ({ page }) => {
      // Arrange: Navigate to 404 page
      await page.goto('/projects/999999');
      await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible();

      // Act: Click "Back to Projects" link
      await page.getByRole('link', { name: /back to projects/i }).click();

      // Assert: User is redirected to projects list
      await expect(page).toHaveURL('/projects');
      // Wait for page to load
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');
    });

    test('should have proper accessibility attributes on 404 page', async ({ page }) => {
      // Act: Navigate to 404 page
      await page.goto('/projects/999999');

      // Assert: Page has proper semantic structure
      // Use locator for nested main element (404 page has its own main) - use .last() since there are 2 mains
      const mainElement = page.locator('main').last();
      await expect(mainElement).toBeVisible();

      // Assert: Alert role for error message (be specific to avoid Next.js route announcer)
      const alertElement = page.locator('[role="alert"][aria-live="polite"]');
      await expect(alertElement).toBeVisible();

      // Assert: Proper heading hierarchy
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1);
    });
  });

  test.describe('Deep Linking', () => {
    test('should handle direct URL navigation to non-existent project', async ({ page }) => {
      // Act: Navigate directly using full URL (simulating user sharing link to non-existent project)
      await page.goto(`http://localhost:3000/projects/999999`);

      // Assert: 404 page loads successfully
      await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible();
      await expect(page).toHaveURL(`/projects/999999`);
    });

    test('should persist 404 state on page refresh', async ({ page }) => {
      // Arrange: Navigate to 404 page
      await page.goto(`/projects/999999`);
      await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible();

      // Act: Refresh the page
      await page.reload();

      // Assert: 404 page is still displayed after refresh
      await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Project Not Found', level: 2 })
      ).toBeVisible();
    });
  });

  test.describe('Accessibility and Semantic HTML', () => {
    test('should have proper semantic HTML structure on 404 page', async ({ page }) => {
      // Act: Navigate to 404 page
      await page.goto(`/projects/999999`);

      // Assert: Main element exists (use locator to be specific about the 404 page's main) - use .last() since there are 2 mains
      const mainElement = page.locator('main').last();
      await expect(mainElement).toBeVisible();

      // Assert: Proper heading hierarchy
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1);

      // Assert: Link has accessible text
      const backLink = page.getByRole('link', { name: /back to projects/i });
      await expect(backLink).toBeVisible();
    });

    test('should have keyboard accessible navigation on 404 page', async ({ page }) => {
      // Act: Navigate to 404 page
      await page.goto(`/projects/999999`);

      // Assert: Link is focusable and can be activated with keyboard
      const backLink = page.getByRole('link', { name: /back to projects/i });
      await backLink.focus();

      // Verify link is focused
      await expect(backLink).toBeFocused();

      // Press Enter to activate link (simulate keyboard navigation)
      await backLink.press('Enter');

      // Assert: Navigation occurred
      await expect(page).toHaveURL('/projects');
    });
  });
});
