/**
 * Example E2E Tests
 * 
 * Basic smoke tests to verify the Playwright setup is working correctly.
 * Tests both frontend and backend connectivity.
 */

import { test, expect } from '@playwright/test';
import { setupTest, checkAPIHealth } from '../helpers/test-helpers';
import { testProjects, generateUniqueProjectName } from '../fixtures/test-data';

test.describe('YouTube Assistant - Basic E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear database before each test for isolation
    await setupTest(page);
  });

  test('homepage loads successfully', async ({ page }) => {
    // Arrange & Act
    await page.goto('/');
    
    // Assert
    await expect(page).toHaveTitle(/YouTube Assistant/i);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('API health check is responding', async ({ page }) => {
    // Act
    const isHealthy = await checkAPIHealth(page);
    
    // Assert
    expect(isHealthy).toBeTruthy();
  });

  test('API projects endpoint returns data', async ({ page }) => {
    // Act
    const response = await page.request.get('http://localhost:8000/api/projects');
    
    // Assert
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const projects = await response.json();
    expect(Array.isArray(projects)).toBeTruthy();
  });

  test('can create a project via UI', async ({ page }) => {
    // Arrange
    const projectName = generateUniqueProjectName('E2E Test Project');
    const projectDescription = 'This is a test project created during E2E testing';
    
    await page.goto('/');
    
    // Act - First click the "Create New Project" button to show the form
    await page.getByRole('button', { name: /create new project/i }).click();
    
    // Wait for form to be visible
    await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
    
    // Fill the form
    await page.getByLabel(/project name/i).fill(projectName);
    await page.getByLabel(/description/i).fill(projectDescription);
    await page.getByRole('button', { name: /create project/i }).click();
    
    // Assert - wait for the project to appear in the list
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 5000 });
  });

  // TODO: Enable when issue #15 is complete (ProjectList component integration)
  test.skip('displays empty state when no projects exist', async ({ page }) => {
    // Arrange - clear database first
    const helpers = await setupTest(page);
    
    // Verify database is actually empty via API
    const projects = await helpers.getAllProjectsViaAPI();
    expect(projects).toHaveLength(0);
    
    // Act - navigate to page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Assert - look for empty state message and create button
    // The empty state shows: "No projects yet. Create your first project to get started!"
    await expect(page.getByText(/create your first project/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create new project/i })).toBeVisible();
    
    // Verify project count is 0
    await expect(page.getByText('0 projects')).toBeVisible();
  });

  test('form validation prevents empty project name', async ({ page }) => {
    // Arrange
    await page.goto('/');
    
    // Act - Click to show form
    await page.getByRole('button', { name: /create new project/i }).click();
    
    // Wait for form to be visible
    await page.getByLabel(/project name/i).waitFor({ state: 'visible' });
    
    // Try to submit with empty name (or just spaces)
    await page.getByLabel(/project name/i).fill('');
    const submitButton = page.getByRole('button', { name: /create project/i });
    
    // Assert - button should be disabled when name is empty
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('API Integration Tests', () => {
  
  test('can perform CRUD operations via API', async ({ request }) => {
    const baseURL = 'http://localhost:8000';
    
    // CREATE
    const createResponse = await request.post(`${baseURL}/api/projects`, {
      data: {
        name: 'API Test Project',
        description: 'Created via API',
        status: 'planned',
      },
    });
    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    expect(created.name).toBe('API Test Project');
    
    // READ
    const getResponse = await request.get(`${baseURL}/api/projects/${created.id}`);
    expect(getResponse.ok()).toBeTruthy();
    const fetched = await getResponse.json();
    expect(fetched.id).toBe(created.id);
    
    // UPDATE
    const updateResponse = await request.put(`${baseURL}/api/projects/${created.id}`, {
      data: {
        name: 'Updated API Test Project',
        description: 'Updated via API',
        status: 'in_progress',
      },
    });
    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();
    expect(updated.name).toBe('Updated API Test Project');
    
    // DELETE
    const deleteResponse = await request.delete(`${baseURL}/api/projects/${created.id}`);
    expect(deleteResponse.ok()).toBeTruthy();
    
    // Verify deletion
    const verifyResponse = await request.get(`${baseURL}/api/projects/${created.id}`);
    expect(verifyResponse.status()).toBe(404);
  });
});
