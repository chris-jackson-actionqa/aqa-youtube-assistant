/**
 * E2E Tests: Template Application to Projects
 *
 * Integration tests for template application workflow on project detail pages:
 * - Template selector presence and visibility
 * - Project detail page load and navigation
 * - Template API integration
 * - Responsive design
 * - Accessibility and error handling
 *
 * Related: Issue #177 - Write E2E Tests for Template Workflows
 * Epic: Issue #166 - Title Template Management
 */

import { test, expect, Page } from '@playwright/test';
import { ProjectHelpers, TemplateHelpers } from '../helpers/test-helpers';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('Template Application to Projects', () => {
  let projectHelpers: ProjectHelpers;
  let templateHelpers: TemplateHelpers;
  let projectId: number;
  let templateOneId: number;
  let templateOneName: string;
  let templateTwoName: string;
  let templateOneContent: string;
  let templateTwoContent: string;

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    projectHelpers = new ProjectHelpers(page);
    templateHelpers = new TemplateHelpers(page);

    // Setup workspace for test isolation
    await projectHelpers.setupWorkspace();
    const workspaceId = projectHelpers.getCurrentWorkspaceId();
    templateHelpers.setWorkspaceId(workspaceId);

    // Create test project with unique name
    const uniqueName = `Template Test ${Date.now()}`;
    const project = await projectHelpers.createProjectViaAPI(
      uniqueName,
      'Project for testing template application'
    );
    projectId = project.id;

    // Create test templates
    const templateTimestamp = Date.now();

    templateOneName = `Template 1 ${templateTimestamp}`;
    templateOneContent = 'How to {{action}} with {{tool}}';
    const templateOne = await templateHelpers.createTemplateViaAPI(
      'title',
      templateOneName,
      templateOneContent
    );
    templateOneId = templateOne.id;

    templateTwoName = `Template 2 ${templateTimestamp + 1}`;
    templateTwoContent = '{{subject}} Guide: {{topic}}';
    await templateHelpers.createTemplateViaAPI('title', templateTwoName, templateTwoContent);
  });

  test.afterEach(async () => {
    // Clean up templates
    await templateHelpers.clearAllTemplates();
    // Clean up workspace
    await projectHelpers.teardownWorkspace();
  });

  const goToProjectPage = async (page: Page) => {
    await page.goto(`/projects/${projectId}`);
    // eslint-disable-next-line playwright/no-networkidle
    await page.waitForLoadState('networkidle');
  };

  const getVideoTitleDisplay = (page: Page) =>
    page.locator('section:has-text("Video Title")').locator('span').first();

  const openTemplateDropdown = async (page: Page) => {
    await page.getByRole('button', { name: /apply template/i }).click();
    await expect(page.getByRole('menu', { name: /template list/i })).toBeVisible();
  };

  const applyTemplateFromDropdown = async (page: Page, templateName: string) => {
    await openTemplateDropdown(page);
    await page.getByRole('button', { name: new RegExp(templateName) }).click();
  };

  test.describe('Project Detail Page', () => {
    test('TA-001: Project detail page loads successfully', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      await expect(page).toHaveURL(`/projects/${projectId}`);
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();
    });

    test('TA-002: Project information is displayed', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Page content includes expected sections
      await expect(page.getByText(/Description/i)).toBeVisible();
      await expect(page.getByText(/Video Title/i)).toBeVisible();
    });

    test('TA-003: Template selector is present on project page', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Template selector button is visible
      const templateSelector = page.getByRole('button', { name: /apply template/i });
      await expect(templateSelector).toBeVisible();
    });

    test('TA-004: Back navigation link is present', async ({ page }) => {
      // Arrange
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Look for back link
      const backLink = page
        .getByRole('link')
        .filter({ hasText: /back|home|projects/i })
        .first();

      // Assert - Back link exists
      await expect(backLink).toBeVisible();
    });
  });

  test.describe('Template Components', () => {
    test('TA-005: Video Title Editor exists', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Video Title section visible
      const videoSection = page.locator('text=Video Title').first();
      await expect(videoSection).toBeVisible();

      // Assert - Edit button present
      const editButton = page.getByRole('button', { name: /edit video title/i });
      await expect(editButton).toBeVisible();
    });

    test('TA-006: Templates API returns data', async ({ request }) => {
      // Arrange
      const workspaceId = projectHelpers.getCurrentWorkspaceId();

      // Act
      const response = await request.get(`${API_BASE_URL}/api/templates`, {
        headers: { 'X-Workspace-Id': workspaceId.toString() },
      });

      // Assert
      expect(response.ok()).toBeTruthy();
      const templates = await response.json();
      expect(Array.isArray(templates)).toBeTruthy();
      expect(templates.length).toBeGreaterThan(0);
    });

    test('TA-007: Project data API works', async ({ request }) => {
      // Arrange
      const workspaceId = projectHelpers.getCurrentWorkspaceId();

      // Act
      const response = await request.get(`${API_BASE_URL}/api/projects/${projectId}`, {
        headers: { 'X-Workspace-Id': workspaceId.toString() },
      });

      // Assert
      expect(response.ok()).toBeTruthy();
      const project = await response.json();
      expect(project.id).toBe(projectId);
    });
  });

  test.describe('Template Application Workflows', () => {
    test('TA-021: Applies title template to new project', async ({ page }) => {
      // Act
      await goToProjectPage(page);
      const titleDisplay = getVideoTitleDisplay(page);
      await expect(titleDisplay).toHaveText('No video title set');

      await applyTemplateFromDropdown(page, templateOneName);

      // Assert
      await expect(titleDisplay).toHaveText(templateOneContent);
    });

    test('TA-022: Applied template can be edited without changing templates', async ({ page }) => {
      // Arrange
      await goToProjectPage(page);
      await applyTemplateFromDropdown(page, templateOneName);

      // Act - edit applied title
      await page.getByRole('button', { name: /edit video title/i }).click();
      const titleInput = page.getByRole('textbox', { name: /video title input/i });
      await titleInput.fill('Custom edited title');
      await page.getByRole('button', { name: /^ok$/i }).click();

      // Assert - new title saved and template source remains available
      const titleDisplay = getVideoTitleDisplay(page);
      await expect(titleDisplay).toHaveText('Custom edited title');

      await openTemplateDropdown(page);
      await expect(page.getByRole('button', { name: new RegExp(templateOneName) })).toBeVisible();
      await expect(page.getByText(templateOneContent)).toBeVisible();
    });

    test('TA-023: Applying template over existing title requires confirmation', async ({
      page,
    }) => {
      // Arrange
      const existingTitle = 'Existing video title';
      await projectHelpers.updateProjectViaAPI(projectId, { video_title: existingTitle });

      // Act
      await goToProjectPage(page);
      const titleDisplay = getVideoTitleDisplay(page);
      await expect(titleDisplay).toHaveText(existingTitle);

      await openTemplateDropdown(page);
      await page.getByRole('button', { name: new RegExp(templateTwoName) }).click();

      // Assert - confirmation dialog appears
      const confirmDialog = page.getByRole('alertdialog');
      await expect(confirmDialog).toBeVisible();
      await expect(
        confirmDialog.getByRole('heading', { name: /replace existing video title/i })
      ).toBeVisible();
      await expect(confirmDialog.getByText(`“${existingTitle}”`)).toBeVisible();

      await page.getByRole('button', { name: /replace/i }).click();
      await expect(titleDisplay).toHaveText(templateTwoContent);
    });

    test('TA-024: Applied title persists after template deletion', async ({ page }) => {
      // Arrange
      await goToProjectPage(page);
      await applyTemplateFromDropdown(page, templateOneName);
      const titleDisplay = getVideoTitleDisplay(page);
      await expect(titleDisplay).toHaveText(templateOneContent);

      // Act
      await templateHelpers.deleteTemplateViaAPI(templateOneId);
      await page.reload();
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      await expect(titleDisplay).toHaveText(templateOneContent);
    });

    test('TA-025: Manual title entry works without applying template', async ({ page }) => {
      // Arrange
      await goToProjectPage(page);

      // Act - set manual title
      await page.getByRole('button', { name: /edit video title/i }).click();
      const titleInput = page.getByRole('textbox', { name: /video title input/i });
      await titleInput.fill('Manual title without template');
      await page.getByRole('button', { name: /^ok$/i }).click();

      const titleDisplay = getVideoTitleDisplay(page);
      await expect(titleDisplay).toHaveText('Manual title without template');

      // Open and close dropdown without selecting a template
      await openTemplateDropdown(page);
      await page.getByRole('button', { name: /^close$/i }).click();

      // Assert manual title unchanged
      await expect(titleDisplay).toHaveText('Manual title without template');
    });
  });

  test.describe('Error Handling', () => {
    test('TA-008: 404 page shown for non-existent project', async ({ page }) => {
      // Using a very high ID that should never exist in practice
      const nonExistentProjectId = Number.MAX_SAFE_INTEGER - 1;

      // Act
      await page.goto(`/projects/${nonExistentProjectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Check for error heading or page indicator
      const errorHeading = page.locator('h1, h2').filter({ hasText: /404|not found|error/i });
      await expect(errorHeading.or(page.locator('text=does not exist'))).toBeVisible();
    });

    test('TA-009: Invalid project ID shows error', async ({ page }) => {
      // Act
      await page.goto('/projects/invalid-id');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Check for error message
      const errorHeading = page.locator('h1, h2').filter({ hasText: /404|error|not found/i });
      await expect(errorHeading).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('TA-010: Page renders on mobile viewport', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 375, height: 667 });

      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();
    });

    test('TA-011: Page renders on tablet viewport', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 768, height: 1024 });

      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();
    });

    test('TA-012: Page renders on desktop viewport', async ({ page }) => {
      // Arrange
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      const mainHeading = page.locator('h1').first();
      await expect(mainHeading).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('TA-013: Page has semantic HTML structure', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Main element exists
      const main = page.locator('main').first();
      await expect(main).toBeVisible();

      // Assert - Headings present
      const headings = page.locator('h1, h2, h3');
      expect(await headings.count()).toBeGreaterThan(0);
    });

    test('TA-014: Page has keyboard navigable elements', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Tab through page - this triggers focus manager
      await page.keyboard.press('Tab');

      // Assert - Page is keyboard navigable (element exists that can receive focus)
      const interactiveElements = page.locator('button, a, input');
      expect(await interactiveElements.count()).toBeGreaterThan(0);
    });

    test('TA-015: Links have descriptive text', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Navigation links exist
      const navLinks = page.locator('a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);

      // Assert - At least one link has meaningful text content or aria-label
      const accessibleLink = page.locator('a[aria-label], a:has-text(/\\S/)').first();
      await expect(accessibleLink).toBeVisible();
    });
  });

  test.describe('Content Display', () => {
    test('TA-016: Description section displayed correctly', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Description section visible
      const descSection = page.locator('text=Description').first();
      await expect(descSection).toBeVisible();
    });

    test('TA-017: Created date is displayed', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Created date visible
      const createdText = page.locator('text=Created').first();
      await expect(createdText).toBeVisible();
    });

    test('TA-018: Updated date is displayed', async ({ page }) => {
      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Updated date visible
      const updatedText = page.locator('text=Updated').first();
      await expect(updatedText).toBeVisible();
    });
  });

  test.describe('Page Performance', () => {
    test('TA-019: Page loads within reasonable time', async ({ page }) => {
      // Act
      const startTime = Date.now();
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');
      const endTime = Date.now();

      // Assert - Page loads in under 5 seconds (reasonable user experience threshold)
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000);
    });

    test('TA-020: No console errors on page load', async ({ page }) => {
      // Collect console error messages
      const messages: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          messages.push(msg.text());
        }
      });

      // Act
      await page.goto(`/projects/${projectId}`);
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - No critical errors (some known, non-critical errors are filtered)
      // Note: Hydration warnings/errors may occur in SSR contexts and are intentionally filtered.
      // Only unexpected, critical errors should cause test failure.
      const nonCriticalPatterns = [
        'hydration', // SSR hydration mismatches
        'act warning', // React act() warnings from test setup
      ];
      const criticalErrors = messages.filter(
        (msg) => !nonCriticalPatterns.some((pattern) => msg.toLowerCase().includes(pattern))
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });
});
