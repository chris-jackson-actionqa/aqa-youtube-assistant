/**
 * Test Data Fixtures for E2E Testing
 *
 * Provides consistent test data for creating, updating, and validating projects.
 */

export interface TestProject {
  name: string;
  description?: string;
  status?: string;
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
