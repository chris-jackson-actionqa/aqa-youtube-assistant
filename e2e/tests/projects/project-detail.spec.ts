/**
 * E2E Tests: Project Detail Page
 *
 * Tests for the project detail page route, focusing on:
 * - Navigation from project list to detail page (Issue #138, #141)
 * - Back navigation link from detail page to project list (Issue #141)
 * - Project data display (name, description, status, dates)
 * - 404 handling for non-existent projects
 * - Custom 404 page rendering and navigation
 * - Accessibility of navigation and 404 page
 *
 * Related: Issue #139, #140, #141
 * Features:
 * - Dynamic route /projects/[id] with server-side rendering
 * - Loading and error states for project detail page
 * - Back navigation link with hover states and accessibility
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

  test.describe('Navigation from Project List', () => {
    test('should navigate to project detail page when clicking project card', async ({ page }) => {
      // Arrange: Create a project
      const project = await helpers.createProjectViaAPI(
        'Navigation Test Project',
        'Test description for navigation'
      );
      await page.goto('/');

      // Act: Click on the project card
      const projectCard = page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Navigation Test Project' });
      await projectCard.click();

      // Assert: URL changed to project detail page
      await expect(page).toHaveURL(`/projects/${project.id}`);

      // Assert: Project title is displayed (minimal design - no description)
      await expect(
        page.getByRole('heading', { name: 'Navigation Test Project', level: 1 })
      ).toBeVisible();

      // Assert: Created and Updated dates are visible
      await expect(page.getByText(/created/i)).toBeVisible();
      await expect(page.getByText(/updated/i)).toBeVisible();
    });

    test('should display project data correctly on detail page', async ({ page }) => {
      // Arrange: Create a project with specific status
      await helpers.createProjectViaAPI('Data Display Test', 'Testing data display', 'in_progress');
      await page.goto('/');

      // Act: Navigate to detail page
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Data Display Test' })
        .click();

      // Assert: Project title and metadata are visible (minimal design - no description or status)
      await expect(
        page.getByRole('heading', { name: 'Data Display Test', level: 1 })
      ).toBeVisible();
      await expect(page.getByText(/created/i)).toBeVisible();
      await expect(page.getByText(/updated/i)).toBeVisible();
    });
  });

  test.describe('Back Navigation', () => {
    test('should show back navigation link on project detail page', async ({ page }) => {
      // Arrange: Create a project and navigate to it
      await helpers.createProjectViaAPI('Back Nav Test');
      await page.goto('/');
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Back Nav Test' })
        .click();

      // Assert: Back link is visible and has correct href
      const backLink = page.getByRole('link', { name: /back to projects/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/');
    });

    test('should navigate back to projects list when clicking back link', async ({ page }) => {
      // Arrange: Create a project and navigate to detail page
      const project = await helpers.createProjectViaAPI('Back Click Test');
      await page.goto('/');
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Back Click Test' })
        .click();
      await expect(page).toHaveURL(`/projects/${project.id}`);

      // Act: Click back link
      await page.getByRole('link', { name: /back to projects/i }).click();

      // Assert: Returned to projects list at root URL
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();
      // Project should still be visible in the list
      await expect(page.getByText('Back Click Test')).toBeVisible();
    });

    test('should have hover state on back navigation link', async ({ page }) => {
      // Arrange: Create a project and navigate to it
      await helpers.createProjectViaAPI('Hover State Test');
      await page.goto('/');
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Hover State Test' })
        .click();

      // Assert: Back link has hover classes
      const backLink = page.getByRole('link', { name: /back to projects/i });
      await expect(backLink).toHaveClass(/hover:text-blue-800/);
    });

    test('should support keyboard navigation on back link', async ({ page }) => {
      // Arrange: Create a project and navigate to it
      const project = await helpers.createProjectViaAPI('Keyboard Nav Test');
      await page.goto(`/projects/${project.id}`);

      // Act: Focus on back link and press Enter
      const backLink = page.getByRole('link', { name: /back to projects/i });
      await backLink.focus();
      await expect(backLink).toBeFocused();

      // Act: Press Enter to navigate
      await page.keyboard.press('Enter');

      // Assert: Navigated back to projects list
      await expect(page).toHaveURL('/');
    });

    test('should have proper accessibility attributes', async ({ page }) => {
      // Arrange: Create a project and navigate to it
      const project = await helpers.createProjectViaAPI('A11y Test');
      await page.goto(`/projects/${project.id}`);

      // Assert: Back link has proper ARIA label
      const backLink = page.getByRole('link', { name: /back to projects/i });
      await expect(backLink).toHaveAttribute('aria-label', 'Back to projects list');

      // Assert: Arrow icon is hidden from screen readers
      const arrowSpan = backLink.locator('span[aria-hidden="true"]');
      await expect(arrowSpan).toBeVisible();
      await expect(arrowSpan).toHaveAttribute('aria-hidden', 'true');
    });
  });

  test.describe('Complete Navigation Flow', () => {
    test('should support full user journey: list → detail → back → list', async ({ page }) => {
      // Arrange: Create multiple projects
      const project1 = await helpers.createProjectViaAPI('Journey Project 1');
      const project2 = await helpers.createProjectViaAPI('Journey Project 2');
      await page.goto('/');

      // Assert: Starting on projects list
      await expect(page).toHaveURL('/');
      await expect(page.getByText('Journey Project 1')).toBeVisible();
      await expect(page.getByText('Journey Project 2')).toBeVisible();

      // Act: Click first project
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Journey Project 1' })
        .click();

      // Assert: On detail page
      await expect(page).toHaveURL(`/projects/${project1.id}`);
      await expect(
        page.getByRole('heading', { name: 'Journey Project 1', level: 1 })
      ).toBeVisible();

      // Act: Click back
      await page.getByRole('link', { name: /back to projects/i }).click();

      // Assert: Back on list
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();

      // Act: Click second project
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Journey Project 2' })
        .click();

      // Assert: On second project detail
      await expect(page).toHaveURL(`/projects/${project2.id}`);
      await expect(
        page.getByRole('heading', { name: 'Journey Project 2', level: 1 })
      ).toBeVisible();

      // Act: Click back again
      await page.getByRole('link', { name: /back to projects/i }).click();

      // Assert: Back on list again
      await expect(page).toHaveURL('/');
    });

    test('should maintain browser history correctly', async ({ page }) => {
      // Arrange: Create a project
      const project = await helpers.createProjectViaAPI('History Test');
      await page.goto('/');

      // Act: Navigate to project
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'History Test' })
        .click();
      await expect(page).toHaveURL(`/projects/${project.id}`);

      // Act: Use browser back button
      await page.goBack();

      // Assert: Returned to list
      await expect(page).toHaveURL('/');

      // Act: Use browser forward button
      await page.goForward();

      // Assert: Back on detail page
      await expect(page).toHaveURL(`/projects/${project.id}`);
    });

    test('should work with browser refresh on detail page', async ({ page }) => {
      // Arrange: Create a project and navigate to it
      const project = await helpers.createProjectViaAPI('Refresh Test', 'Test refresh behavior');
      await page.goto('/');
      await page
        .locator('[data-testid="project-card"]')
        .filter({ hasText: 'Refresh Test' })
        .click();
      await expect(page).toHaveURL(`/projects/${project.id}`);

      // Act: Refresh the page
      await page.reload();

      // Assert: Still on detail page with title and dates loaded (minimal design - no description)
      await expect(page).toHaveURL(`/projects/${project.id}`);
      await expect(page.getByRole('heading', { name: 'Refresh Test', level: 1 })).toBeVisible();
      await expect(page.getByText(/created/i)).toBeVisible();
      await expect(page.getByText(/updated/i)).toBeVisible();

      // Assert: Back link still works after refresh
      await page.getByRole('link', { name: /back to projects/i }).click();
      await expect(page).toHaveURL('/');
    });
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
      await expect(backLink).toHaveAttribute('href', '/');
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
      await expect(page).toHaveURL('/');
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

  test.describe('Project Description Display', () => {
    test('should display project description when present', async ({ page }) => {
      // Arrange: Create project with multi-line description
      const project = await helpers.createProjectViaAPI(
        'Description Test Project',
        'This is a detailed description\nwith multiple lines\nfor testing'
      );

      // Act: Navigate to project detail page
      await page.goto(`/projects/${project.id}`);

      // Assert: Description section is visible
      const descriptionSection = page.locator('section').filter({ hasText: 'Description' });
      await expect(descriptionSection).toBeVisible();

      // Assert: Description heading is present
      const descriptionHeading = page.getByRole('heading', { level: 2, name: 'Description' });
      await expect(descriptionHeading).toBeVisible();

      // Assert: Description text contains all lines
      const descriptionText = descriptionSection.locator('p').first();
      await expect(descriptionText).toContainText('This is a detailed description');
      await expect(descriptionText).toContainText('with multiple lines');
      await expect(descriptionText).toContainText('for testing');
    });

    test('should show fallback text when description is null', async ({ page }) => {
      // Arrange: Create project with default empty description (API may convert to null)
      const project = await helpers.createProjectViaAPI('No Description Project');

      // Act: Navigate to project detail page
      await page.goto(`/projects/${project.id}`);

      // Assert: Description section is visible
      const descriptionSection = page.locator('section').filter({ hasText: 'Description' });
      await expect(descriptionSection).toBeVisible();

      // Assert: Fallback text is shown
      await expect(descriptionSection.getByText('No description provided')).toBeVisible();
    });

    test('should show fallback text when description is empty string', async ({ page }) => {
      // Arrange: Create project with empty description
      const project = await helpers.createProjectViaAPI('Empty Description Project', '');

      // Act: Navigate to project detail page
      await page.goto(`/projects/${project.id}`);

      // Assert: Description section is visible
      const descriptionSection = page.locator('section').filter({ hasText: 'Description' });
      await expect(descriptionSection).toBeVisible();

      // Assert: Fallback text is shown
      await expect(descriptionSection.getByText('No description provided')).toBeVisible();
    });

    test('should preserve line breaks in description', async ({ page }) => {
      // Arrange: Create project with multi-line description
      const project = await helpers.createProjectViaAPI(
        'Multi-line Project',
        'Line 1\nLine 2\nLine 3'
      );

      // Act: Navigate to project detail page
      await page.goto(`/projects/${project.id}`);

      // Assert: Check CSS property for whitespace preservation
      const descriptionText = page
        .locator('section')
        .filter({ hasText: 'Description' })
        .locator('p')
        .first();

      const whiteSpace = await descriptionText.evaluate((el) => {
        const win = el.ownerDocument.defaultView;
        return win ? win.getComputedStyle(el).whiteSpace : '';
      });
      expect(whiteSpace).toMatch(/pre-wrap|pre-line/);
    });

    test('should have proper heading hierarchy for accessibility', async ({ page }) => {
      // Arrange: Create project
      const project = await helpers.createProjectViaAPI(
        'Accessibility Test Project',
        'Test description for accessibility'
      );

      // Act: Navigate to project detail page
      await page.goto(`/projects/${project.id}`);

      // Assert: Check heading structure
      const h1 = page.getByRole('heading', { level: 1, name: 'Accessibility Test Project' });
      const h2 = page.getByRole('heading', { level: 2, name: 'Description' });

      await expect(h1).toBeVisible();
      await expect(h2).toBeVisible();

      // Assert: Only one h1 on page
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    });

    test('should handle very long descriptions', async ({ page }) => {
      // Arrange: Create project with very long description
      const longDescription = 'A'.repeat(500) + '\n' + 'B'.repeat(500);
      const project = await helpers.createProjectViaAPI(
        'Long Description Project',
        longDescription
      );

      // Act: Navigate to project detail page
      await page.goto(`/projects/${project.id}`);

      // Assert: Description section is visible
      const descriptionSection = page.locator('section').filter({ hasText: 'Description' });
      await expect(descriptionSection).toBeVisible();

      // Assert: Long text is displayed (check for part of it)
      const descriptionText = descriptionSection.locator('p').first();
      await expect(descriptionText).toBeVisible();
      await expect(descriptionText).toContainText('A'.repeat(100)); // Check first 100 chars
    });

    test('should handle special characters in description', async ({ page }) => {
      // Arrange: Create project with special characters
      const specialDescription = 'Description with <html> & "quotes" & \'apostrophes\'';
      const project = await helpers.createProjectViaAPI(
        'Special Chars Project',
        specialDescription
      );

      // Act: Navigate to project detail page
      await page.goto(`/projects/${project.id}`);

      // Assert: Description displays special characters correctly (not as HTML)
      const descriptionText = page
        .locator('section')
        .filter({ hasText: 'Description' })
        .locator('p')
        .first();
      await expect(descriptionText).toContainText('<html>');
      await expect(descriptionText).toContainText('"quotes"');
      await expect(descriptionText).toContainText("'apostrophes'");
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

      // Assert: Navigation occurred to projects list page
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Video Title Editor - Issue #161', () => {
    test.describe('Empty State Display', () => {
      test('should show "No video title set" placeholder when video_title is null', async ({
        page,
      }) => {
        // Arrange: Create project without video title
        const project = await helpers.createProjectViaAPI('Empty Video Title Project');

        // Act: Navigate to project detail page
        await page.goto(`/projects/${project.id}`);

        // Assert: Video Title section is visible
        const videoTitleSection = page.locator('section').filter({ hasText: 'Video Title' });
        await expect(videoTitleSection).toBeVisible();

        // Assert: Video Title heading is present
        await expect(page.getByRole('heading', { level: 2, name: 'Video Title' })).toBeVisible();

        // Assert: Placeholder text is shown
        await expect(videoTitleSection.getByText('No video title set')).toBeVisible();

        // Assert: Edit button is visible
        await expect(page.getByRole('button', { name: 'Edit video title' })).toBeVisible();
      });

      test('should have proper accessibility for empty state', async ({ page }) => {
        // Arrange: Create project without video title
        const project = await helpers.createProjectViaAPI('A11y Empty State Test');

        // Act: Navigate to project detail page
        await page.goto(`/projects/${project.id}`);

        // Assert: Edit button has accessible label
        const editButton = page.getByRole('button', { name: 'Edit video title' });
        await expect(editButton).toBeVisible();
        await expect(editButton).toHaveAttribute('aria-label', 'Edit video title');
      });
    });

    test.describe('Opening Editor Popover', () => {
      test('should open popover when clicking edit button', async ({ page }) => {
        // Arrange: Create project without video title
        const project = await helpers.createProjectViaAPI('Popover Open Test');
        await page.goto(`/projects/${project.id}`);

        // Act: Click edit button
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Assert: Popover dialog is visible
        const dialog = page.getByRole('dialog', { name: 'Edit Video Title' });
        await expect(dialog).toBeVisible();

        // Assert: Dialog has heading
        await expect(
          dialog.getByRole('heading', { level: 3, name: 'Edit Video Title' })
        ).toBeVisible();

        // Assert: Input field is visible and focused
        const input = page.getByRole('textbox', { name: 'Video title input' });
        await expect(input).toBeVisible();
        await expect(input).toBeFocused();

        // Assert: Save and Cancel buttons are visible
        await expect(page.getByRole('button', { name: 'OK' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
      });

      test('should have empty input field for new video title', async ({ page }) => {
        // Arrange: Create project without video title
        const project = await helpers.createProjectViaAPI('Empty Input Test');
        await page.goto(`/projects/${project.id}`);

        // Act: Open editor
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Assert: Input field is empty
        const input = page.getByRole('textbox', { name: 'Video title input' });
        await expect(input).toHaveValue('');
        await expect(input).toHaveAttribute('placeholder', 'Enter video title');
      });
    });

    test.describe('Creating New Video Title', () => {
      test('should save new video title when clicking OK button', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Create Title Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Enter video title
        const newTitle = 'How to Build Amazing E2E Tests with Playwright';
        await page.getByRole('textbox', { name: 'Video title input' }).fill(newTitle);

        // Act: Click OK button
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Popover closes
        await expect(page.getByRole('dialog', { name: 'Edit Video Title' })).toBeHidden();

        // Assert: New title is displayed
        const videoTitleSection = page.locator('section').filter({ hasText: 'Video Title' });
        await expect(videoTitleSection.getByText(newTitle)).toBeVisible();

        // Assert: Placeholder is no longer visible
        await expect(videoTitleSection.getByText('No video title set')).toBeHidden();
      });

      test('should persist video title after page refresh', async ({ page }) => {
        // Arrange: Create project and add video title
        const project = await helpers.createProjectViaAPI('Persist Title Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        const newTitle = 'Testing Persistence with Page Refresh';
        await page.getByRole('textbox', { name: 'Video title input' }).fill(newTitle);
        await page.getByRole('button', { name: 'OK' }).click();

        // Wait for title to be saved
        await expect(page.getByText(newTitle)).toBeVisible();

        // Act: Refresh page
        await page.reload();

        // Assert: Video title is still displayed after refresh
        await expect(page.getByText(newTitle)).toBeVisible();
        await expect(page.getByText('No video title set')).toBeHidden();
      });

      test('should handle multi-line video titles', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Multi-line Title Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Enter multi-line title (though typically titles are single line)
        const newTitle = 'First Line\nSecond Line\nThird Line';
        await page.getByRole('textbox', { name: 'Video title input' }).fill(newTitle);
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Full title is displayed
        await expect(page.getByText('First Line')).toBeVisible();
      });
    });

    test.describe('Editing Existing Video Title', () => {
      test('should pre-fill input with existing video title', async ({ page }) => {
        // Arrange: Create project with video title
        const project = await helpers.createProjectViaAPI('Edit Existing Test');
        await page.goto(`/projects/${project.id}`);

        // Add initial title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        const initialTitle = 'Initial Video Title';
        await page.getByRole('textbox', { name: 'Video title input' }).fill(initialTitle);
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page.getByText(initialTitle)).toBeVisible();

        // Act: Open editor again
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Assert: Input is pre-filled with existing title
        const input = page.getByRole('textbox', { name: 'Video title input' });
        await expect(input).toHaveValue(initialTitle);
      });

      test('should update existing video title', async ({ page }) => {
        // Arrange: Create project with video title
        const project = await helpers.createProjectViaAPI('Update Title Test');
        await page.goto(`/projects/${project.id}`);

        // Add initial title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('Original Title');
        await page.getByRole('button', { name: 'OK' }).click();

        // Act: Edit the title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        const updatedTitle = 'Updated Video Title After Edit';
        await page.getByRole('textbox', { name: 'Video title input' }).fill(updatedTitle);
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Updated title is displayed
        await expect(page.getByText(updatedTitle)).toBeVisible();
        await expect(page.getByText('Original Title')).toBeHidden();
      });

      test('should show updated title after editing', async ({ page }) => {
        // Arrange: Create project with initial video title
        const project = await helpers.createProjectViaAPI('Show Updated Test');
        await page.goto(`/projects/${project.id}`);

        // Add initial title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('First Title');
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page.getByText('First Title')).toBeVisible();

        // Act: Update to second title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('Second Title');
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Display mode shows the new title
        const videoTitleSection = page.locator('section').filter({ hasText: 'Video Title' });
        await expect(videoTitleSection.getByText('Second Title')).toBeVisible();
        await expect(videoTitleSection.getByText('First Title')).toBeHidden();
      });
    });

    test.describe('Cancel Functionality', () => {
      test('should close popover without saving when clicking Cancel', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Cancel Button Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Enter text but cancel
        await page.getByRole('textbox', { name: 'Video title input' }).fill('Unsaved Title');
        await page.getByRole('button', { name: 'Cancel' }).click();

        // Assert: Popover is closed
        await expect(page.getByRole('dialog', { name: 'Edit Video Title' })).toBeHidden();

        // Assert: Placeholder still shows (title wasn't saved)
        await expect(page.getByText('No video title set')).toBeVisible();
        await expect(page.getByText('Unsaved Title')).toBeHidden();
      });

      test('should not modify existing title when canceling edit', async ({ page }) => {
        // Arrange: Create project with existing title
        const project = await helpers.createProjectViaAPI('Cancel Existing Test');
        await page.goto(`/projects/${project.id}`);

        // Add initial title
        const existingTitle = 'Existing Title Should Remain';
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill(existingTitle);
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page.getByText(existingTitle)).toBeVisible();

        // Act: Open editor, modify, and cancel
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('Changed Text');
        await page.getByRole('button', { name: 'Cancel' }).click();

        // Assert: Original title still displayed
        await expect(page.getByText(existingTitle)).toBeVisible();
        await expect(page.getByText('Changed Text')).toBeHidden();
      });
    });

    test.describe('Keyboard Navigation', () => {
      test('should close popover when pressing Escape key', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Escape Key Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Enter some text and press Escape
        await page.getByRole('textbox', { name: 'Video title input' }).fill('Test Title');
        await page.keyboard.press('Escape');

        // Assert: Popover is closed
        await expect(page.getByRole('dialog', { name: 'Edit Video Title' })).toBeHidden();

        // Assert: Title was not saved
        await expect(page.getByText('No video title set')).toBeVisible();
        await expect(page.getByText('Test Title')).toBeHidden();
      });

      test('should save title when pressing Enter key', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Enter Key Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Enter text and press Enter
        const newTitle = 'Save with Enter Key';
        await page.getByRole('textbox', { name: 'Video title input' }).fill(newTitle);
        await page.keyboard.press('Enter');

        // Assert: Popover closes
        await expect(page.getByRole('dialog', { name: 'Edit Video Title' })).toBeHidden();

        // Assert: Title is saved and displayed
        await expect(page.getByText(newTitle)).toBeVisible();
      });

      test('should focus input field when popover opens', async ({ page }) => {
        // Arrange: Create project
        const project = await helpers.createProjectViaAPI('Focus Test');
        await page.goto(`/projects/${project.id}`);

        // Act: Open editor
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Assert: Input field receives focus automatically
        const input = page.getByRole('textbox', { name: 'Video title input' });
        await expect(input).toBeFocused();
      });

      test('should be able to tab between input and buttons', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Tab Navigation Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Assert: Input is focused initially
        const input = page.getByRole('textbox', { name: 'Video title input' });
        await expect(input).toBeFocused();

        // Act: Tab to Cancel button
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();

        // Act: Tab to OK button
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'OK' })).toBeFocused();
      });
    });

    test.describe('Character Length Validation', () => {
      test('should accept title up to 500 characters', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Max Length Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Enter exactly 500 characters
        const maxLengthTitle = 'A'.repeat(500);
        await page.getByRole('textbox', { name: 'Video title input' }).fill(maxLengthTitle);
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Title is saved
        await expect(page.getByRole('dialog', { name: 'Edit Video Title' })).toBeHidden();

        // Assert: Title is displayed (check for part of it)
        await expect(page.getByText('A'.repeat(100))).toBeVisible();
      });

      test('should enforce 500 character limit on input', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Length Limit Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Try to enter more than 500 characters
        const tooLongTitle = 'B'.repeat(600);
        await page.getByRole('textbox', { name: 'Video title input' }).fill(tooLongTitle);

        // Assert: Input is limited to 500 characters
        const input = page.getByRole('textbox', { name: 'Video title input' });
        const inputValue = await input.inputValue();
        expect(inputValue).toHaveLength(500);
      });
    });

    test.describe('Special Characters Handling', () => {
      test('should handle special characters in video title', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Special Chars Title Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Enter title with special characters
        const specialTitle = 'Title with <html> & "quotes" & \'apostrophes\' & émojis 🎉';
        await page.getByRole('textbox', { name: 'Video title input' }).fill(specialTitle);
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Title displays correctly (not as HTML)
        await expect(page.getByText('<html>')).toBeVisible();
        await expect(page.getByText('"quotes"')).toBeVisible();
        await expect(page.getByText("'apostrophes'")).toBeVisible();
        await expect(page.getByText('🎉')).toBeVisible();
      });

      test('should handle emoji in video title', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('Emoji Title Test');
        await page.goto(`/projects/${project.id}`);
        await page.getByRole('button', { name: 'Edit video title' }).click();

        // Act: Enter title with emojis
        const emojiTitle = '🚀 Amazing Tutorial 🎯 Learn Fast 💡';
        await page.getByRole('textbox', { name: 'Video title input' }).fill(emojiTitle);
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Emojis are displayed correctly
        await expect(page.getByText('🚀')).toBeVisible();
        await expect(page.getByText('🎯')).toBeVisible();
        await expect(page.getByText('💡')).toBeVisible();
      });
    });

    test.describe('UI State and Visual Feedback', () => {
      test('should show edit button in both empty and filled states', async ({ page }) => {
        // Arrange: Create project
        const project = await helpers.createProjectViaAPI('Edit Button State Test');
        await page.goto(`/projects/${project.id}`);

        // Assert: Edit button visible in empty state
        await expect(page.getByRole('button', { name: 'Edit video title' })).toBeVisible();

        // Act: Add a title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('New Title');
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Edit button still visible in filled state
        await expect(page.getByRole('button', { name: 'Edit video title' })).toBeVisible();
      });

      test('should have consistent styling for video title section', async ({ page }) => {
        // Arrange: Create project with video title
        const project = await helpers.createProjectViaAPI('Styling Test');
        await page.goto(`/projects/${project.id}`);

        // Add title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('Styled Title');
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Video Title section has proper structure
        const videoTitleSection = page.locator('section').filter({ hasText: 'Video Title' });
        await expect(videoTitleSection).toBeVisible();

        // Assert: Section matches Description section structure (both are siblings)
        const descriptionSection = page.locator('section').filter({ hasText: 'Description' });
        await expect(descriptionSection).toBeVisible();
      });
    });

    test.describe('Accessibility Features', () => {
      test('should have proper ARIA labels on all interactive elements', async ({ page }) => {
        // Arrange: Create project and open editor
        const project = await helpers.createProjectViaAPI('ARIA Labels Test');
        await page.goto(`/projects/${project.id}`);

        // Assert: Edit button has aria-label
        const editButton = page.getByRole('button', { name: 'Edit video title' });
        await expect(editButton).toHaveAttribute('aria-label', 'Edit video title');

        // Act: Open editor
        await editButton.click();

        // Assert: Dialog has proper role and label
        const dialog = page.getByRole('dialog', { name: 'Edit Video Title' });
        await expect(dialog).toBeVisible();

        // Assert: Input has proper aria-label
        const input = page.getByRole('textbox', { name: 'Video title input' });
        await expect(input).toHaveAttribute('aria-label', 'Video title input');
      });

      test('should maintain heading hierarchy with video title section', async ({ page }) => {
        // Arrange: Create project with video title
        const project = await helpers.createProjectViaAPI('Heading Hierarchy Test');
        await page.goto(`/projects/${project.id}`);

        // Assert: Check heading structure
        const h1 = page.getByRole('heading', { level: 1 });
        await expect(h1).toHaveCount(1);

        // Assert: Video Title is h2 (same level as Description)
        const videoTitleHeading = page.getByRole('heading', { level: 2, name: 'Video Title' });
        await expect(videoTitleHeading).toBeVisible();

        const descriptionHeading = page.getByRole('heading', {
          level: 2,
          name: 'Description',
        });
        await expect(descriptionHeading).toBeVisible();

        // Assert: Edit dialog heading is h3 (nested under section)
        await page.getByRole('button', { name: 'Edit video title' }).click();
        const dialogHeading = page.getByRole('heading', { level: 3, name: 'Edit Video Title' });
        await expect(dialogHeading).toBeVisible();
      });

      test('should announce changes to screen readers', async ({ page }) => {
        // Arrange: Create project
        const project = await helpers.createProjectViaAPI('Screen Reader Test');
        await page.goto(`/projects/${project.id}`);

        // Act: Add video title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('Announced Title');
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Video title section should have the new content visible
        // (Screen reader announcements would be handled by aria-live regions if implemented)
        await expect(page.getByText('Announced Title')).toBeVisible();
      });
    });

    test.describe('Integration with Project Details Page', () => {
      test('should display video title section alongside other sections', async ({ page }) => {
        // Arrange: Create project with description and video title
        const project = await helpers.createProjectViaAPI(
          'Integration Test',
          'Project description'
        );
        await page.goto(`/projects/${project.id}`);

        // Add video title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('Integration Title');
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: Both sections are visible
        await expect(page.getByRole('heading', { level: 2, name: 'Description' })).toBeVisible();
        await expect(page.getByText('Project description')).toBeVisible();
        await expect(page.getByRole('heading', { level: 2, name: 'Video Title' })).toBeVisible();
        await expect(page.getByText('Integration Title')).toBeVisible();
      });

      test('should maintain page state when editing video title', async ({ page }) => {
        // Arrange: Create project
        const project = await helpers.createProjectViaAPI('State Test', 'Test description');
        await page.goto(`/projects/${project.id}`);

        // Assert: Initial page elements are present
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByText('Test description')).toBeVisible();
        await expect(page.getByRole('link', { name: /back to projects/i })).toBeVisible();

        // Act: Edit video title
        await page.getByRole('button', { name: 'Edit video title' }).click();
        await page.getByRole('textbox', { name: 'Video title input' }).fill('New Title');
        await page.getByRole('button', { name: 'OK' }).click();

        // Assert: All page elements are still present
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByText('Test description')).toBeVisible();
        await expect(page.getByRole('link', { name: /back to projects/i })).toBeVisible();
        await expect(page.getByText('New Title')).toBeVisible();
      });
    });
  });
});
