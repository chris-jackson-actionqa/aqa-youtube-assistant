/**
 * Test Helpers for E2E Testing
 *
 * Provides reusable helper functions and classes for common E2E test operations.
 * Follows Page Object Model pattern for maintainability.
 */

import { Page, expect, APIRequestContext } from '@playwright/test';

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * ProjectHelpers - Page Object for Project-related operations
 *
 * Encapsulates all project-related interactions to improve test maintainability
 * and reduce duplication across test files.
 */
export class ProjectHelpers {
  private readonly baseURL: string;

  constructor(
    private page: Page,
    private request?: APIRequestContext
  ) {
    this.baseURL = 'http://localhost:8000';
  }

  /**
   * Navigate to the home page
   */
  async goToHomePage() {
    await this.page.goto('/');
    // eslint-disable-next-line playwright/no-networkidle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reload the page and wait for projects to load
   * Useful after creating projects via API
   */
  async reloadAndWaitForProjects() {
    await this.page.goto('/');
    // eslint-disable-next-line playwright/no-networkidle
    await this.page.waitForLoadState('networkidle');

    // Wait for either projects to load or empty state to appear
    try {
      await Promise.race([
        this.page
          .locator('[data-testid="project-card"]')
          .first()
          .waitFor({ state: 'visible', timeout: 3000 }),
        this.page
          .locator('text=/No projects yet|Get started/')
          .waitFor({ state: 'visible', timeout: 3000 }),
      ]);
    } catch {
      // If neither appears, that's ok - page might be loading
    }
  }

  /**
   * Create a new project via the UI
   */
  async createProjectViaUI(name: string, description?: string) {
    // Navigate to home if not already there
    await this.goToHomePage();

    // Click the "Create New Project" button to show the form
    await this.page.getByRole('button', { name: /create new project/i }).click();

    // Wait for form to be visible
    await this.page.getByLabel(/project name/i).waitFor({ state: 'visible' });

    // Fill the form using accessible selectors
    await this.page.getByLabel(/project name/i).fill(name);

    if (description) {
      await this.page.getByLabel(/description/i).fill(description);
    }

    // Submit the form
    await this.page.getByRole('button', { name: /create project/i }).click();

    // Wait for the new project card to appear in the list
    await this.page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: name })
      .waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Delete a project by name via UI
   */
  async deleteProjectViaUI(projectName: string) {
    // Find the project card/item
    const projectCard = this.page
      .locator(`[data-testid="project-card"]`)
      .filter({ hasText: projectName });

    // Click delete button
    const deleteButton = projectCard.getByRole('button', { name: /delete/i });
    await deleteButton.click();

    // Confirm deletion in modal (if exists)
    try {
      const confirmButton = this.page.getByRole('button', { name: /confirm|delete/i });
      await confirmButton.click({ timeout: 2000 });
    } catch {
      // No confirmation modal, deletion was immediate
    }

    // Wait for the project card to be removed from the DOM
    await projectCard.waitFor({ state: 'detached' });
  }

  /**
   * Select/click on a project
   */
  async selectProject(projectName: string) {
    const projectCard = this.page
      .locator(`[data-testid="project-card"]`)
      .filter({ hasText: projectName });
    await projectCard.click();
  }

  /**
   * Verify a project exists in the list
   */
  async verifyProjectExists(projectName: string) {
    const projectCard = this.page
      .locator(`[data-testid="project-card"]`)
      .filter({ hasText: projectName });
    await expect(projectCard).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify a project does not exist in the list
   */
  async verifyProjectNotExists(projectName: string) {
    const projectCard = this.page
      .locator(`[data-testid="project-card"]`)
      .filter({ hasText: projectName });
    await expect(projectCard).toBeHidden();
  }

  /**
   * Get all projects via API
   */
  async getAllProjectsViaAPI(): Promise<Project[]> {
    const context = this.request || this.page.request;
    const response = await context.get(`${this.baseURL}/api/projects`);

    if (!response.ok()) {
      throw new Error(`Failed to fetch projects: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Clear all projects from the database via API
   * Used for test isolation
   */
  async clearDatabase() {
    try {
      const projects = await this.getAllProjectsViaAPI();
      const context = this.request || this.page.request;

      // Delete all projects
      for (const project of projects) {
        await context.delete(`${this.baseURL}/api/projects/${project.id}`);
      }

      // Poll until database is actually empty (up to 2s)
      const maxWaitMs = 2000;
      const pollInterval = 50;
      let waited = 0;
      let remainingProjects: Project[] = [];

      do {
        remainingProjects = await this.getAllProjectsViaAPI();
        if (remainingProjects.length === 0) break;
        // eslint-disable-next-line playwright/no-wait-for-timeout
        await this.page.waitForTimeout(pollInterval);
        waited += pollInterval;
      } while (waited < maxWaitMs);

      if (remainingProjects.length > 0) {
        console.warn(`Warning: ${remainingProjects.length} projects still exist after cleanup`);
      }
    } catch (error) {
      console.warn('Failed to clear database:', error);
      // Don't fail the test if cleanup fails
    }
  }

  /**
   * Create a project via API (faster than UI for test setup)
   */
  async createProjectViaAPI(
    name: string,
    description: string = '',
    status: string = 'planned'
  ): Promise<Project> {
    const context = this.request || this.page.request;
    const response = await context.post(`${this.baseURL}/api/projects`, {
      data: {
        name,
        description,
        status,
      },
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(`Failed to create project via API: ${response.status()} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Update a project via API
   */
  async updateProjectViaAPI(
    id: number,
    updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Project> {
    const context = this.request || this.page.request;
    const response = await context.put(`${this.baseURL}/api/projects/${id}`, {
      data: updates,
    });

    if (!response.ok()) {
      throw new Error(`Failed to update project via API: ${response.status()}`);
    }

    return response.json();
  }

  /**
   * Delete a project via API
   */
  async deleteProjectViaAPI(id: number): Promise<void> {
    const context = this.request || this.page.request;
    const response = await context.delete(`${this.baseURL}/api/projects/${id}`);

    if (!response.ok()) {
      throw new Error(`Failed to delete project via API: ${response.status()}`);
    }
  }

  /**
   * Wait for API response (useful for asserting API calls)
   */
  async waitForProjectsAPICall() {
    return this.page.waitForResponse(
      (response) => response.url().includes('/api/projects') && response.status() === 200
    );
  }

  /**
   * Get project count from UI
   */
  async getProjectCountFromUI(): Promise<number> {
    const projectCards = this.page.locator('[data-testid="project-card"]');
    return projectCards.count();
  }
}

/**
 * Setup helper for tests
 * Initializes ProjectHelpers and clears the database for test isolation
 */
export async function setupTest(page: Page): Promise<ProjectHelpers> {
  const helpers = new ProjectHelpers(page);

  // Clear database first for test isolation
  await helpers.clearDatabase();

  // Wait for the UI to reflect the cleared database (no project cards present)
  try {
    // eslint-disable-next-line playwright/no-wait-for-selector
    await page.waitForSelector('[data-testid="project-card"]', {
      state: 'detached',
      timeout: 2000,
    });
  } catch {
    // If no project cards exist to begin with, this will timeout - that's OK
  }

  return helpers;
}

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 5000) {
  // eslint-disable-next-line playwright/no-wait-for-selector
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = Date.now();
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Check if API health endpoint is responding
 */
export async function checkAPIHealth(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('http://localhost:8000/api/health');
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Wait for a specific amount of time (use sparingly, prefer waitForSelector)
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
