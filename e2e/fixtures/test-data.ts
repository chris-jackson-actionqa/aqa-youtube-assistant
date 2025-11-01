/**
 * Test Data Fixtures for E2E Testing
 *
 * Provides consistent test data for creating, updating, and validating projects.
 * Also includes workspace utilities for test isolation and parallel execution.
 */

export interface TestProject {
  name: string;
  description?: string;
  status?: string;
}

export interface TestWorkspace {
  id: number;
  name: string;
  description: string;
}

export const testProjects = {
  valid: {
    name: 'Test Project',
    description: 'A test project for E2E testing',
    status: 'planned',
  },

  minimal: {
    name: 'Minimal Project',
    description: '',
    status: 'planned',
  },

  complete: {
    name: 'Complete Project',
    description: 'A fully detailed test project with all fields populated',
    status: 'in_progress',
  },

  duplicate: {
    name: 'Duplicate Project',
    description: 'Testing duplicate validation',
    status: 'planned',
  },

  longDescription: {
    name: 'Long Description Project',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
    status: 'planned',
  },
};

export const invalidProjects = {
  emptyName: {
    name: '',
    description: 'Should fail validation',
  },

  whitespaceOnly: {
    name: '   ',
    description: 'Whitespace name should fail',
  },

  tooLongName: {
    name: 'A'.repeat(256),
    description: 'Name exceeds maximum length',
  },
};

export const projectStatuses = {
  planned: 'planned',
  in_progress: 'in_progress',
  completed: 'completed',
  archived: 'archived',
};

/**
 * Generate a unique project name for test isolation
 */
export function generateUniqueProjectName(prefix: string = 'Test Project'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix} ${timestamp}-${random}`;
}

/**
 * Generate test project with optional overrides
 */
export function createTestProject(overrides: Partial<TestProject> = {}): TestProject {
  return {
    name: generateUniqueProjectName(),
    description: testProjects.valid.description,
    status: testProjects.valid.status,
    ...overrides,
  };
}

/**
 * Create a unique test workspace for test isolation
 * Enables parallel test execution without data conflicts
 */
export async function createTestWorkspace(
  request: import('@playwright/test').APIRequestContext
): Promise<TestWorkspace> {
  const name = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const response = await request.post('http://localhost:8000/api/workspaces', {
    data: { name, description: 'Automated test workspace' },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test workspace: ${response.status()}`);
  }

  return response.json();
}

/**
 * Delete a test workspace and all its projects
 * Used in test teardown to ensure proper cleanup
 */
export async function deleteTestWorkspace(
  request: import('@playwright/test').APIRequestContext,
  workspaceId: number
): Promise<void> {
  try {
    // Delete all projects first
    const projectsRes = await request.get('http://localhost:8000/api/projects', {
      headers: { 'X-Workspace-Id': workspaceId.toString() },
    });

    if (projectsRes.ok()) {
      const projects = await projectsRes.json();
      await Promise.all(
        projects.map((p: { id: number }) =>
          request.delete(`http://localhost:8000/api/projects/${p.id}`, {
            headers: { 'X-Workspace-Id': workspaceId.toString() },
          })
        )
      );
    }

    // Delete workspace
    await request.delete(`http://localhost:8000/api/workspaces/${workspaceId}`);
  } catch (error) {
    console.error('Workspace cleanup failed:', error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}
