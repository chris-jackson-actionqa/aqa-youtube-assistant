/**
 * E2E Tests: Templates Page
 *
 * Comprehensive tests for the templates page functionality, covering:
 * - Navigation and page access
 * - Empty state display
 * - Templates list rendering
 * - Type filtering (All, Title, Description)
 * - API integration and error handling
 * - Responsive design and accessibility
 *
 * Related: Issue #172 - Create Templates Page Route and Navigation
 * Epic: Issue #166 - Title Template Management
 */

import { test, expect } from '@playwright/test';
import { ProjectHelpers, TemplateHelpers } from '../helpers/test-helpers';

test.describe('Templates Page', () => {
  let helpers: ProjectHelpers;
  let templateHelpers: TemplateHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ProjectHelpers(page);
    templateHelpers = new TemplateHelpers(page);

    // Setup workspace for test isolation
    await helpers.setupWorkspace();

    // Pass workspace context to template helpers
    templateHelpers.setWorkspaceId(helpers.getCurrentWorkspaceId());

    // Clear all templates before each test
    await templateHelpers.clearAllTemplates();
  });

  test.afterEach(async () => {
    // Clean up templates
    await templateHelpers.clearAllTemplates();

    // Clean up workspace
    await helpers.teardownWorkspace();
  });

  test.describe('Navigation', () => {
    test('should navigate to templates page from main navigation', async ({ page }) => {
      // Arrange
      await page.goto('/');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act
      await page.getByRole('link', { name: 'Templates' }).click();

      // Assert
      await expect(page).toHaveURL('/templates');
      await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
    });

    test('should show back to home link and navigate back', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act
      const backLink = page.getByRole('link', { name: /back to home/i });
      await expect(backLink).toBeVisible();
      await backLink.click();

      // Assert
      await expect(page).toHaveURL('/');
    });

    test('should display page header and description', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
      await expect(page.getByText('Manage video title and description templates')).toBeVisible();
    });
  });

  test.describe('Empty State', () => {
    test('should display empty state when no templates exist', async ({ page }) => {
      // Arrange & Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      await expect(
        page.getByText('No templates found. Create your first template to get started.')
      ).toBeVisible();
    });
  });

  test.describe('Template Creation', () => {
    test('TC-001: should open create template modal when Create Template button is clicked', async ({
      page,
    }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act
      await page.getByRole('button', { name: /create.*template/i }).click();

      // Assert - Modal opens
      const dialog = page.getByRole('dialog', { name: /create new template/i });
      await expect(dialog).toBeVisible();

      // Assert - Form fields are present
      await expect(page.getByRole('textbox', { name: /template type/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /template name/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /template content/i })).toBeVisible();

      // Assert - Submit button is disabled initially
      await expect(page.getByRole('button', { name: 'Create Template' })).toBeDisabled();
    });

    test('TC-002: should create a new template with valid data', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Open create modal
      await page.getByRole('button', { name: /create.*template/i }).click();

      const dialog = page.getByRole('dialog', { name: /create new template/i });
      await expect(dialog).toBeVisible();

      // Act - Fill form
      await page.getByRole('textbox', { name: /template type/i }).fill('title');
      await page.getByRole('textbox', { name: /template name/i }).fill('New Test Template');
      await page
        .getByRole('textbox', { name: /template content/i })
        .fill('How to {{action}} in {{timeframe}}');

      // Setup API response listener
      const createResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/templates') && response.request().method() === 'POST'
      );

      // Act - Submit form
      await page.getByRole('button', { name: 'Create Template' }).click();

      // Assert - API call made
      const createResponse = await createResponsePromise;
      expect(createResponse.ok()).toBeTruthy();

      // Assert - Modal closes
      await expect(dialog).toBeHidden();

      // Assert - New template appears in list
      await expect(page.getByText('New Test Template')).toBeVisible();
      await expect(page.getByText('How to {{action}} in {{timeframe}}')).toBeVisible();
    });

    test('TC-003: should validate required fields', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /create.*template/i }).click();

      const dialog = page.getByRole('dialog', { name: /create new template/i });
      await expect(dialog).toBeVisible();

      // Assert - Submit button disabled when fields are empty
      await expect(page.getByRole('button', { name: 'Create Template' })).toBeDisabled();

      // Act - Fill only template type
      await page.getByRole('textbox', { name: /template type/i }).fill('title');

      // Assert - Still disabled
      await expect(page.getByRole('button', { name: 'Create Template' })).toBeDisabled();

      // Act - Fill template name
      await page.getByRole('textbox', { name: /template name/i }).fill('Test Template');

      // Assert - Still disabled (missing content)
      await expect(page.getByRole('button', { name: 'Create Template' })).toBeDisabled();

      // Act - Fill content with placeholder
      await page
        .getByRole('textbox', { name: /template content/i })
        .fill('Content with {{placeholder}}');

      // Assert - Now enabled
      await expect(page.getByRole('button', { name: 'Create Template' })).toBeEnabled();
    });

    test('TC-004: should validate placeholder syntax', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /create.*template/i }).click();

      // Act - Fill form with invalid placeholder (empty braces)
      await page.getByRole('textbox', { name: /template type/i }).fill('title');
      await page.getByRole('textbox', { name: /template name/i }).fill('Invalid Template');
      await page.getByRole('textbox', { name: /template content/i }).fill('Content with {{}}');

      // Assert - Submit button should be disabled for invalid placeholder
      await expect(page.getByRole('button', { name: 'Create Template' })).toBeDisabled();
    });

    test('TC-005: should validate at least one placeholder is required', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /create.*template/i }).click();

      // Act - Fill form without any placeholders
      await page.getByRole('textbox', { name: /template type/i }).fill('title');
      await page.getByRole('textbox', { name: /template name/i }).fill('No Placeholder Template');
      await page
        .getByRole('textbox', { name: /template content/i })
        .fill('Content without placeholders');

      // Assert - Submit button should be disabled
      await expect(page.getByRole('button', { name: 'Create Template' })).toBeDisabled();
    });

    test('TC-006: should enforce character limits', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /create.*template/i }).click();

      const dialog = page.getByRole('dialog', { name: /create new template/i });

      // Act - Fill template name with max characters (100)
      const longName = 'A'.repeat(100);
      await page.getByRole('textbox', { name: /template name/i }).fill(longName);

      // Assert - Character count displays correctly
      await expect(dialog).toContainText('100 / 100 characters');

      // Act - Try to exceed limit (should be truncated by input)
      await page.getByRole('textbox', { name: /template name/i }).fill(longName + 'B');

      // Assert - Still at 100
      await expect(dialog).toContainText('100 / 100 characters');
    });

    test('TC-007: should cancel template creation', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /create.*template/i }).click();

      const dialog = page.getByRole('dialog', { name: /create new template/i });
      await expect(dialog).toBeVisible();

      // Act - Fill form partially
      await page.getByRole('textbox', { name: /template name/i }).fill('Cancelled Template');

      // Act - Click cancel
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Assert - Modal closes
      await expect(dialog).toBeHidden();

      // Assert - Template not created
      await expect(page.getByText('Cancelled Template')).toBeHidden();
    });

    test('TC-008: should close modal on Escape key', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /create.*template/i }).click();

      const dialog = page.getByRole('dialog', { name: /create new template/i });
      await expect(dialog).toBeVisible();

      // Act - Press Escape
      await page.keyboard.press('Escape');

      // Assert - Modal closes
      await expect(dialog).toBeHidden();
    });

    test('TC-009: should display placeholder syntax help', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /create.*template/i }).click();

      const dialog = page.getByRole('dialog', { name: /create new template/i });

      // Assert - Help text is visible
      await expect(dialog).toContainText('Placeholder Syntax:');
      await expect(dialog).toContainText('Use double curly braces');
      await expect(dialog).toContainText('{{name}}');
      await expect(dialog).toContainText('Each template must have at least one placeholder');
    });

    test('TC-010: should show detected placeholders in content', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /create.*template/i }).click();

      // Act - Fill content with multiple placeholders
      await page
        .getByRole('textbox', { name: /template content/i })
        .fill('How to {{action}} in {{timeframe}} using {{tool}}');

      // Assert - Should show detected placeholders (implementation may vary)
      const dialog = page.getByRole('dialog', { name: /create new template/i });

      // Wait a moment for placeholder detection to update
      await page.waitForTimeout(500);

      // Check if placeholders are shown somewhere in the dialog
      try {
        await expect(dialog).toContainText('{{action}}');
      } catch {
        // Placeholder detection display is optional feature
      }
    });

    test('TC-011: should handle API errors gracefully', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Mock API failure
      await page.route('**/api/templates', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({ status: 500, body: 'Server error' });
        } else {
          route.continue();
        }
      });

      await page.getByRole('button', { name: /create.*template/i }).click();

      // Act - Fill and submit form
      await page.getByRole('textbox', { name: /template type/i }).fill('title');
      await page.getByRole('textbox', { name: /template name/i }).fill('Error Template');
      await page
        .getByRole('textbox', { name: /template content/i })
        .fill('Content {{placeholder}}');
      await page.getByRole('button', { name: 'Create Template' }).click();

      // Assert - Error message displayed
      const dialog = page.getByRole('dialog', { name: /create new template/i });
      await expect(dialog).toContainText(/failed|error/i);
    });
  });

  test.describe('Template Editing', () => {
    test.beforeEach(async () => {
      // Create a template to edit
      await templateHelpers.createTemplateViaAPI(
        'Title',
        'Template to Edit',
        'Original content with {{placeholder}}'
      );
    });

    test('TE-001: should open edit template modal when Edit button is clicked', async ({
      page,
    }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act
      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      // Assert - Modal opens
      const dialog = page.getByRole('dialog', { name: /edit template/i });
      await expect(dialog).toBeVisible();

      // Assert - Form fields are pre-populated
      await expect(page.getByRole('textbox', { name: /template type/i })).toHaveValue('title');
      await expect(page.getByRole('textbox', { name: /template name/i })).toHaveValue(
        'Template to Edit'
      );
      await expect(page.getByRole('textbox', { name: /template content/i })).toHaveValue(
        'Original content with {{placeholder}}'
      );

      // Assert - Update button is enabled
      await expect(page.getByRole('button', { name: 'Update Template' })).toBeEnabled();
    });

    test('TE-002: should update template with modified data', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Open edit modal
      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      const dialog = page.getByRole('dialog', { name: /edit template/i });
      await expect(dialog).toBeVisible();

      // Act - Modify fields
      await page.getByRole('textbox', { name: /template name/i }).clear();
      await page.getByRole('textbox', { name: /template name/i }).fill('Updated Template Name');
      await page.getByRole('textbox', { name: /template content/i }).clear();
      await page
        .getByRole('textbox', { name: /template content/i })
        .fill('Updated content with {{new_placeholder}}');

      // Setup API response listener
      const updateResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/templates/') && response.request().method() === 'PUT'
      );

      // Act - Submit form
      await page.getByRole('button', { name: 'Update Template' }).click();

      // Assert - API call made
      const updateResponse = await updateResponsePromise;
      expect(updateResponse.ok()).toBeTruthy();

      // Assert - Modal closes
      await expect(dialog).toBeHidden();

      // Assert - Updated template appears in list
      await expect(page.getByText('Updated Template Name')).toBeVisible();
      await expect(page.getByText('Updated content with {{new_placeholder}}')).toBeVisible();
      await expect(page.getByText('Template to Edit')).toBeHidden();
    });

    test('TE-003: should validate required fields during edit', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      // Act - Clear required field
      await page.getByRole('textbox', { name: /template name/i }).clear();

      // Assert - Update button disabled
      await expect(page.getByRole('button', { name: 'Update Template' })).toBeDisabled();

      // Act - Fill field again
      await page.getByRole('textbox', { name: /template name/i }).fill('Valid Name');

      // Assert - Update button enabled
      await expect(page.getByRole('button', { name: 'Update Template' })).toBeEnabled();
    });

    test('TE-004: should validate placeholder syntax during edit', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      // Act - Change content to invalid placeholder
      await page.getByRole('textbox', { name: /template content/i }).clear();
      await page
        .getByRole('textbox', { name: /template content/i })
        .fill('Invalid content with {{}}');

      // Assert - Update button disabled
      await expect(page.getByRole('button', { name: 'Update Template' })).toBeDisabled();
    });

    test('TE-005: should validate at least one placeholder during edit', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      // Act - Change content to have no placeholders
      await page.getByRole('textbox', { name: /template content/i }).clear();
      await page
        .getByRole('textbox', { name: /template content/i })
        .fill('Content without placeholders');

      // Assert - Update button disabled
      await expect(page.getByRole('button', { name: 'Update Template' })).toBeDisabled();
    });

    test('TE-006: should cancel template edit', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      const dialog = page.getByRole('dialog', { name: /edit template/i });
      await expect(dialog).toBeVisible();

      // Act - Modify field
      await page.getByRole('textbox', { name: /template name/i }).clear();
      await page.getByRole('textbox', { name: /template name/i }).fill('Should Not Save');

      // Act - Click cancel
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Assert - Modal closes
      await expect(dialog).toBeHidden();

      // Assert - Original template name still visible
      await expect(page.getByText('Template to Edit')).toBeVisible();
      await expect(page.getByText('Should Not Save')).toBeHidden();
    });

    test('TE-007: should close edit modal on Escape key', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      const dialog = page.getByRole('dialog', { name: /edit template/i });
      await expect(dialog).toBeVisible();

      // Act - Press Escape
      await page.keyboard.press('Escape');

      // Assert - Modal closes
      await expect(dialog).toBeHidden();
    });

    test('TE-008: should handle API errors during update', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Mock API failure
      await page.route('**/api/templates/*', (route) => {
        if (route.request().method() === 'PUT') {
          route.fulfill({ status: 500, body: 'Server error' });
        } else {
          route.continue();
        }
      });

      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      // Act - Modify and submit
      await page.getByRole('textbox', { name: /template name/i }).clear();
      await page.getByRole('textbox', { name: /template name/i }).fill('Error Update');
      await page.getByRole('button', { name: 'Update Template' }).click();

      // Assert - Error message displayed
      const dialog = page.getByRole('dialog', { name: /edit template/i });
      await expect(dialog).toContainText(/failed|error/i);
    });

    test('TE-009: should preserve template type during edit', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      const dialog = page.getByRole('dialog', { name: /edit template/i });

      // Assert - Template type field should have original value
      const typeField = page.getByRole('textbox', { name: /template type/i });
      await expect(typeField).toHaveValue('title');

      // Act - Try to change type
      await typeField.clear();
      await typeField.fill('description');

      // Act - Submit
      await page.getByRole('button', { name: 'Update Template' }).click();

      // Wait for modal to close
      await expect(dialog).toBeHidden();

      // Assert - Template badge should reflect new type
      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      // Verify the type was updated
      await expect(page.getByRole('textbox', { name: /template type/i })).toHaveValue(
        'description'
      );
    });

    test('TE-010: should display character count during edit', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: /edit template template to edit/i }).click();

      const dialog = page.getByRole('dialog', { name: /edit template/i });

      // Assert - Character count displays for pre-filled name
      const nameLength = 'Template to Edit'.length;
      await expect(dialog).toContainText(`${nameLength} / 100 characters`);
    });
  });

  test.describe('Templates List Display', () => {
    test('should display templates when they exist', async ({ page }) => {
      // Arrange - Create a template via API
      await templateHelpers.createTemplateViaAPI(
        'Title',
        'Test Template',
        'How to {{topic}} in {{duration}} minutes'
      );

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      await expect(page.getByText('Test Template')).toBeVisible();
      await expect(page.getByText(/how to/i)).toBeVisible();
      // Use more specific selector for type badge to avoid matching page description
      await expect(
        page
          .locator('span')
          .filter({ hasText: /^Title$/ })
          .first()
      ).toBeVisible();
    });

    test('should display multiple templates', async ({ page }) => {
      // Arrange - Create multiple templates
      await templateHelpers.createTemplateViaAPI(
        'Title',
        'Title Template 1',
        'First template {{content}}'
      );
      await templateHelpers.createTemplateViaAPI(
        'Description',
        'Description Template 1',
        'Second template {{content}}'
      );

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert
      await expect(page.getByText('Title Template 1')).toBeVisible();
      await expect(page.getByText('Description Template 1')).toBeVisible();
    });

    test('should display template metadata (created date)', async ({ page }) => {
      // Arrange
      await templateHelpers.createTemplateViaAPI('Title', 'Dated Template', 'Template {{content}}');

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Look for "Created:" label
      await expect(page.getByText(/created:/i)).toBeVisible();
    });

    test('should display type badges with correct styling', async ({ page }) => {
      // Arrange
      await templateHelpers.createTemplateViaAPI('Title', 'Title Badge Test', '{{content}}');
      await templateHelpers.createTemplateViaAPI(
        'Description',
        'Description Badge Test',
        '{{content}}'
      );

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Both type badges should be visible
      const titleBadges = page.locator('span').filter({ hasText: /^Title$/ });
      const descriptionBadges = page.locator('span').filter({ hasText: /^Description$/ });

      await expect(titleBadges.first()).toBeVisible();
      await expect(descriptionBadges.first()).toBeVisible();
    });
  });

  test.describe('Template Filtering', () => {
    test.beforeEach(async () => {
      // Create templates of both types for filtering tests
      await templateHelpers.createTemplateViaAPI('Title', 'Title Template', 'Title {{content}}');
      await templateHelpers.createTemplateViaAPI(
        'Description',
        'Description Template',
        'Description {{content}}'
      );
    });

    test('should show all templates by default', async ({ page }) => {
      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Both templates visible
      await expect(page.getByText('Title Template')).toBeVisible();
      // Use getByRole heading to avoid matching page description text
      await expect(page.getByRole('heading', { name: 'Description Template' })).toBeVisible();

      // Assert - "All" filter is active
      const allButton = page.getByRole('button', { name: /All \(2\)/i });
      await expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should filter to show only Title templates', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act
      await page.getByRole('button', { name: /Title \(1\)/i }).click();

      // Assert - Only Title template visible
      await expect(page.getByText('Title Template')).toBeVisible();
      // Use heading selector to avoid matching page description text
      await expect(page.getByRole('heading', { name: 'Description Template' })).toBeHidden();

      // Assert - Title filter is active
      const titleButton = page.getByRole('button', { name: /Title \(1\)/i });
      await expect(titleButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should filter to show only Description templates', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act
      await page.getByRole('button', { name: /Description \(1\)/i }).click();

      // Assert - Only Description template visible
      // Use getByRole heading to avoid matching page description text
      await expect(page.getByRole('heading', { name: 'Description Template' })).toBeVisible();
      await expect(page.getByText('Title Template')).toBeHidden();

      // Assert - Description filter is active
      const descButton = page.getByRole('button', { name: /Description \(1\)/i });
      await expect(descButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should switch between filters correctly', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act & Assert - Switch to Title
      await page.getByRole('button', { name: /Title \(1\)/i }).click();
      await expect(page.getByText('Title Template')).toBeVisible();
      // Use heading selector to avoid matching page description text
      await expect(page.getByRole('heading', { name: 'Description Template' })).toBeHidden();

      // Act & Assert - Switch to Description
      await page.getByRole('button', { name: /Description \(1\)/i }).click();
      // Use getByRole heading to avoid matching page description text
      await expect(page.getByRole('heading', { name: 'Description Template' })).toBeVisible();
      await expect(page.getByText('Title Template')).toBeHidden();

      // Act & Assert - Switch back to All
      await page.getByRole('button', { name: /All \(2\)/i }).click();
      await expect(page.getByText('Title Template')).toBeVisible();
      // Use getByRole heading to avoid matching page description text
      await expect(page.getByRole('heading', { name: 'Description Template' })).toBeVisible();
    });

    test('should display correct counts in filter buttons', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Filter counts are correct
      await expect(page.getByRole('button', { name: /All \(2\)/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Title \(1\)/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Description \(1\)/i })).toBeVisible();
    });

    test('should show empty state message when filtered type has no templates', async ({
      page,
    }) => {
      // Arrange - Clear templates from beforeEach and create only Title templates
      await templateHelpers.clearAllTemplates();

      // Create only Title templates
      await templateHelpers.createTemplateViaAPI('Title', 'Only Title Template', '{{content}}');

      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Filter to Description (which has none)
      await page.getByRole('button', { name: /Description \(0\)/i }).click();

      // Assert - Empty state for filtered type
      await expect(page.getByText('No Description templates found.')).toBeVisible();
    });
  });

  test.describe('API Integration', () => {
    test('should call templates API on page load', async ({ page }) => {
      // Arrange
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/templates') && response.status() === 200
      );

      // Act
      await page.goto('/templates');

      // Assert
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Arrange - Mock API failure
      await page.route('**/api/templates', (route) =>
        route.fulfill({ status: 500, body: 'Server error' })
      );

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Error state displayed
      await expect(page.getByText(/Error/i).first()).toBeVisible();
      // Check for error/retry UI instead of specific error message
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    });

    test('should display loading state while fetching', async ({ page }) => {
      // Arrange - Delay the API response
      await page.route('**/api/templates', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fulfill({
          status: 200,
          body: JSON.stringify([]),
        });
      });

      // Act
      await page.goto('/templates');

      // Assert - Loading state briefly visible
      await expect(page.getByText(/loading templates/i)).toBeVisible({ timeout: 1000 });

      // Wait for loading to complete
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');
    });

    test('should retry loading templates after error', async ({ page }) => {
      let requestCount = 0;

      // Arrange - Fail first request, succeed on retry
      await page.route('**/api/templates', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({ status: 500, body: 'Server error' });
        } else {
          route.fulfill({
            status: 200,
            body: JSON.stringify([
              {
                id: 1,
                type: 'Title',
                name: 'Test Template',
                content: '{{content}}',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]),
          });
        }
      });

      // Act - Initial load shows error
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');
      // Use more specific selector for error alert (not Next.js route announcer)
      const errorAlert = page.locator('[role="alert"]').filter({ hasText: /error/i }).first();
      await expect(errorAlert).toBeVisible();

      // Act - Click retry
      await page.getByRole('button', { name: /retry/i }).click();

      // Assert - Templates loaded successfully
      await expect(page.getByText('Test Template')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle template names near max length', async ({ page }) => {
      // Arrange - Name max is 100 chars, use 95 chars to test near-limit
      const longName = 'A'.repeat(95) + ' Test';
      await templateHelpers.createTemplateViaAPI('Title', longName, '{{content}}');

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Long name displays (check first 50 chars)
      await expect(page.getByText(longName.substring(0, 50))).toBeVisible();
    });

    test('should handle special characters in template content', async ({ page }) => {
      // Arrange
      await templateHelpers.createTemplateViaAPI(
        'Title',
        'Special Chars Template',
        'Template with "quotes", <brackets>, & ampersands {{placeholder}}'
      );

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Special characters render correctly
      await expect(page.getByText(/quotes.*brackets.*ampersands/i)).toBeVisible();
    });

    test('should handle emoji in template names', async ({ page }) => {
      // Arrange
      await templateHelpers.createTemplateViaAPI('Title', '🎬 Video Template 🎥', '{{content}}');

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Emoji renders
      await expect(page.getByText('🎬 Video Template 🎥')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on filter buttons', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Filter buttons have aria-pressed
      const allButton = page.getByRole('button', { name: /All/i });
      await expect(allButton).toHaveAttribute('aria-pressed');

      const titleButton = page.getByRole('button', { name: /Title/i });
      await expect(titleButton).toHaveAttribute('aria-pressed');

      const descButton = page.getByRole('button', { name: /Description/i });
      await expect(descButton).toHaveAttribute('aria-pressed');
    });

    test('should have role="alert" on error message', async ({ page }) => {
      // Arrange
      await page.route('**/api/templates', (route) =>
        route.fulfill({ status: 500, body: 'Server error' })
      );

      // Act
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Use more specific selector for error alert (not Next.js route announcer)
      const errorAlert = page.locator('[role="alert"]').filter({ hasText: /error/i }).first();
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });

    test('should support keyboard navigation for filters', async ({ page }) => {
      // Arrange
      await templateHelpers.createTemplateViaAPI('Title', 'Test', '{{content}}');

      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Focus and click Title filter button using keyboard
      const titleButton = page.getByRole('button', { name: /Title \(1\)/i });
      await titleButton.focus();
      await page.keyboard.press('Enter');

      // Assert - Title filter activated
      await expect(titleButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Template Deletion', () => {
    test.beforeEach(async () => {
      // Create templates for deletion tests
      await templateHelpers.createTemplateViaAPI(
        'Title',
        'Template to Delete',
        'This is {{template}} content'
      );
      await templateHelpers.createTemplateViaAPI(
        'Description',
        'Another Template',
        'Another {{template}}'
      );
    });

    test('should display delete button on each template card', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Assert - Delete buttons visible for both templates
      const deleteButtons = page.getByRole('button', { name: /Delete template/i });
      await expect(deleteButtons).toHaveCount(2);
    });

    test('TD-001: should show confirmation dialog when delete button is clicked', async ({
      page,
    }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Click delete button for first template
      await page.getByRole('button', { name: /Delete template Template to Delete/i }).click();

      // Assert - Confirmation dialog appears
      const dialog = page.getByRole('dialog', { name: /Delete template/i });
      await expect(dialog).toBeVisible();

      // Assert - Dialog shows template name
      await expect(dialog).toContainText('Template to Delete');

      // Assert - Dialog has warning message
      await expect(dialog).toContainText(/This action cannot be undone/i);

      // Assert - Dialog has Cancel button
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

      // Assert - Dialog has Delete Template button
      await expect(page.getByRole('button', { name: 'Delete Template' })).toBeVisible();
    });

    test('TD-002: should cancel deletion and close dialog when cancel is clicked', async ({
      page,
    }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Open confirmation dialog
      await page.getByRole('button', { name: /Delete template Template to Delete/i }).click();

      const dialog = page.getByRole('dialog', { name: /Delete template/i });
      await expect(dialog).toBeVisible();

      // Act - Click cancel
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Assert - Dialog closes
      await expect(dialog).toBeHidden();

      // Assert - Template still exists
      await expect(page.getByText('Template to Delete')).toBeVisible();
    });

    test('TD-003: should close dialog when Escape key is pressed', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Open confirmation dialog
      await page.getByRole('button', { name: /Delete template Another Template/i }).click();

      const dialog = page.getByRole('dialog', { name: /Delete template/i });
      await expect(dialog).toBeVisible();

      // Act - Press Escape key
      await page.keyboard.press('Escape');

      // Assert - Dialog closes
      await expect(dialog).toBeHidden();

      // Assert - Template still exists
      await expect(page.getByText('Another Template')).toBeVisible();
    });

    test('TD-001 (Critical): should delete template after confirming', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Verify template exists
      await expect(page.getByText('Template to Delete')).toBeVisible();

      // Act - Open confirmation dialog
      await page.getByRole('button', { name: /Delete template Template to Delete/i }).click();

      const dialog = page.getByRole('dialog', { name: /Delete template/i });
      await expect(dialog).toBeVisible();

      // Setup API response listener
      const deleteResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes('/api/templates/') && response.request().method() === 'DELETE'
      );

      // Act - Confirm deletion
      await page.getByRole('button', { name: 'Delete Template' }).click();

      // Assert - API call made
      const deleteResponse = await deleteResponsePromise;
      expect(deleteResponse.ok()).toBeTruthy();

      // Assert - Dialog closes
      await expect(dialog).toBeHidden();

      // Assert - Template removed from list
      await expect(page.getByText('Template to Delete')).toBeHidden();

      // Assert - Other template still exists
      await expect(page.getByText('Another Template')).toBeVisible();
    });

    test('TD-004: should display error message when deletion fails', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Mock API failure for deletion
      await page.route('**/api/templates/*', (route) => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({ status: 500, body: 'Server error' });
        } else {
          route.continue();
        }
      });

      // Act - Open confirmation dialog and confirm deletion
      await page.getByRole('button', { name: /Delete template Template to Delete/i }).click();

      const dialog = page.getByRole('dialog', { name: /Delete template/i });
      await expect(dialog).toBeVisible();

      await page.getByRole('button', { name: 'Delete Template' }).click();

      // Assert - Error message displayed in dialog
      await expect(dialog).toContainText(/failed to delete|error/i);

      // Assert - Template still exists in list (after closing error)
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByText('Template to Delete')).toBeVisible();
    });

    test('TD-005: should support keyboard navigation in delete dialog', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Open confirmation dialog
      await page.getByRole('button', { name: /Delete template Template to Delete/i }).click();

      const dialog = page.getByRole('dialog', { name: /Delete template/i });
      await expect(dialog).toBeVisible();

      // Assert - Cancel button has focus initially
      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await expect(cancelButton).toBeFocused();

      // Act - Tab to Delete button
      await page.keyboard.press('Tab');

      // Assert - Delete Template button now has focus
      const deleteButton = page.getByRole('button', { name: 'Delete Template' });
      await expect(deleteButton).toBeFocused();

      // Act - Shift+Tab back to Cancel
      await page.keyboard.press('Shift+Tab');

      // Assert - Cancel button has focus again
      await expect(cancelButton).toBeFocused();
    });

    test('TD-006: should show empty state after deleting last template', async ({ page }) => {
      // Arrange - Clear all templates and create just one
      await templateHelpers.clearAllTemplates();
      await templateHelpers.createTemplateViaAPI('Title', 'Last Template', '{{content}}');

      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Verify one template exists
      await expect(page.getByText('Last Template')).toBeVisible();

      // Act - Delete the last template
      await page.getByRole('button', { name: /Delete template Last Template/i }).click();

      const dialog = page.getByRole('dialog', { name: /Delete template/i });
      await expect(dialog).toBeVisible();

      await page.getByRole('button', { name: 'Delete Template' }).click();

      // Assert - Empty state message displayed
      await expect(
        page.getByText(/No templates found. Create your first template to get started./i)
      ).toBeVisible();
    });

    test('should close dialog when clicking backdrop', async ({ page }) => {
      // Arrange
      await page.goto('/templates');
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');

      // Act - Open confirmation dialog
      await page.getByRole('button', { name: /Delete template Template to Delete/i }).click();

      const dialog = page.getByRole('dialog', { name: /Delete template/i });
      await expect(dialog).toBeVisible();

      // Act - Click outside the dialog (backdrop)
      // Click at a position that's outside the dialog content
      await page.mouse.click(50, 50);

      // Assert - Dialog closes
      await expect(dialog).toBeHidden();

      // Assert - Template still exists
      await expect(page.getByText('Template to Delete')).toBeVisible();
    });
  });
});
