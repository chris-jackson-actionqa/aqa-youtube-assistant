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
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a new project via the UI
   */
  async createProjectViaUI(name: string, description?: string) {
    // Navigate to home if not already there
    await this.goToHomePage();
    
    // Fill the form using accessible selectors
    const nameInput = this.page.getByLabel(/project name/i);
    await nameInput.fill(name);
    
    if (description) {
      const descInput = this.page.getByLabel(/description/i);
      await descInput.fill(description);
    }
    
    // Submit the form
    const submitButton = this.page.getByRole('button', { name: /create|submit/i });
    await submitButton.click();
    
    // Wait for the project to appear or success message
    await this.page.waitForTimeout(1000);
  }

  /**
   * Delete a project by name via UI
   */
  async deleteProjectViaUI(projectName: string) {
    // Find the project card/item
    const projectCard = this.page.locator(`[data-testid="project-card"]`).filter({ hasText: projectName });
    
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
    
    // Wait for deletion to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Select/click on a project
   */
  async selectProject(projectName: string) {
    const projectCard = this.page.locator(`[data-testid="project-card"]`).filter({ hasText: projectName });
    await projectCard.click();
  }

  /**
   * Verify a project exists in the list
   */
  async verifyProjectExists(projectName: string) {
    const projectCard = this.page.locator(`[data-testid="project-card"]`).filter({ hasText: projectName });
    await expect(projectCard).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify a project does not exist in the list
   */
  async verifyProjectNotExists(projectName: string) {
    const projectCard = this.page.locator(`[data-testid="project-card"]`).filter({ hasText: projectName });
    await expect(projectCard).not.toBeVisible();
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
      
      for (const project of projects) {
        await context.delete(`${this.baseURL}/api/projects/${project.id}`);
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
      (response) => 
        response.url().includes('/api/projects') && 
        response.status() === 200
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
  await helpers.clearDatabase();
  return helpers;
}

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = Date.now();
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`, 
    fullPage: true 
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
  return new Promise(resolve => setTimeout(resolve, ms));
}
