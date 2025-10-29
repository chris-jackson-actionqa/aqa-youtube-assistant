# Test Isolation Strategies for E2E Tests

## Problem Statement

E2E tests that share a database can interfere with each other when run in parallel, leading to:

- Tests seeing leftover data from other tests
- Incorrect project counts in assertions
- Flaky tests that pass in isolation but fail when run together
- Race conditions during database cleanup

## Current Implementation

**Status:** Sequential execution with full database cleanup

- Tests run one at a time (`workers: 1`, `fullyParallel: false`)
- Each test clears entire database before running
- Slower execution but more reliable

## Proposed Solutions

### 1. Unique Test Namespaces ⭐ (Recommended)

**Concept:** Each test uses a unique identifier and only interacts with its own data.

**Implementation:**

```typescript
// Each test creates projects with unique prefixes
const testId = `test-${Date.now()}-${Math.random()}`;
await helpers.createProjectViaAPI(`${testId}-Project Alpha`);
await helpers.createProjectViaAPI(`${testId}-Project Beta`);

// Only query/delete projects with your testId
const myProjects = allProjects.filter((p) => p.name.startsWith(testId));
```

**Pros:**

- ✅ Tests can run fully in parallel
- ✅ No database cleanup needed between tests
- ✅ No test interference
- ✅ Realistic (production has data too!)

**Cons:**

- ❌ Database accumulates test data over time
- ❌ Need periodic manual cleanup
- ❌ Slightly more complex assertions

---

### 2. Test-Scoped Database Cleanup

**Concept:** Tests only clean up their own data, not the entire database.

**Implementation:**

```typescript
class ProjectHelpers {
  private createdProjectIds: number[] = [];

  async createProjectViaAPI(name: string) {
    const project = await // ... create
    this.createdProjectIds.push(project.id);
    return project;
  }

  async cleanupMyProjects() {
    // Only delete projects THIS test created
    for (const id of this.createdProjectIds) {
      await this.deleteProjectViaAPI(id);
    }
    this.createdProjectIds = [];
  }
}

// In test
test.afterEach(async () => {
  await helpers.cleanupMyProjects();
});
```

**Pros:**

- ✅ Safe parallel execution
- ✅ Tests clean up after themselves
- ✅ No data accumulation

**Cons:**

- ❌ Need to track all created resources
- ❌ Cleanup can fail silently
- ❌ More complex helper implementation

---

### 3. Test Groups with Different Isolation Levels

**Concept:** Organize tests by their isolation requirements.

**Implementation:**

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'isolated-tests',
      testMatch: '**/isolated/**/*.spec.ts',
      fullyParallel: false,
      workers: 1,
    },
    {
      name: 'parallel-tests',
      testMatch: '**/parallel/**/*.spec.ts',
      fullyParallel: true,
      workers: 4,
    },
  ],
});
```

**Test Organization:**

```
e2e/tests/
  ├── isolated/           # Sequential, full DB cleanup
  │   ├── empty-state.spec.ts
  │   └── initial-setup.spec.ts
  └── parallel/           # Parallel, unique namespaces
      ├── project-creation.spec.ts
      └── project-management.spec.ts
```

**Pros:**

- ✅ Flexibility - choose isolation level per test
- ✅ Fast tests run parallel, critical tests isolated
- ✅ Easy to understand test organization

**Cons:**

- ❌ Need to organize tests into folders
- ❌ More configuration complexity
- ❌ Still need isolation strategy for parallel tests

---

### 4. Database Per Worker (Advanced)

**Concept:** Each Playwright worker gets its own database file.

**Implementation:**

```typescript
// global-setup.ts
export default async function globalSetup() {
  const workerIndex = process.env.TEST_PARALLEL_INDEX || '0';
  process.env.DB_FILE = `test-${workerIndex}.db`;
  // Each worker uses: test-0.db, test-1.db, test-2.db, etc.
}

// Backend needs to respect DB_FILE environment variable
// sqlite_file = os.getenv('DB_FILE', 'app.db')
```

**Pros:**

- ✅ Perfect isolation between workers
- ✅ Full parallelism without interference
- ✅ Each worker can assume empty database

**Cons:**

- ❌ Requires backend support for multiple databases
- ❌ More complex infrastructure
- ❌ Need to coordinate database URLs
- ❌ Memory overhead (multiple DB files)

---

### 5. Smart Test Ordering with Fixtures

**Concept:** Use tags and dependencies to control test execution order.

**Implementation:**

```typescript
// Tests declare their requirements
test.describe('Empty State Tests', { tag: '@requires-empty-db' }, () => {
  // These run first, sequentially
  test('should show empty state', async () => {});
});

test.describe('CRUD Tests', { tag: '@parallel-safe' }, () => {
  // These run after, in parallel, with unique names
  test('should create project', async () => {});
});

// playwright.config.ts
projects: [
  {
    name: 'empty-state',
    testMatch: '**/*.spec.ts',
    grep: /@requires-empty-db/,
    fullyParallel: false,
    workers: 1,
  },
  {
    name: 'parallel',
    testMatch: '**/*.spec.ts',
    grep: /@parallel-safe/,
    dependencies: ['empty-state'],
    fullyParallel: true,
  },
];
```

**Pros:**

- ✅ Balance between speed and reliability
- ✅ Explicit test requirements
- ✅ Flexible execution strategy

**Cons:**

- ❌ Requires discipline in test tagging
- ❌ More configuration overhead
- ❌ Easy to forget tags on new tests

---

### 6. Idempotent Tests (Production-Ready)

**Concept:** Tests work regardless of existing data in the database.

**Implementation:**

```typescript
test('should display all existing projects', async ({ page }) => {
  // Create test data with unique IDs
  const testId = generateUniqueTestId();
  await helpers.createProjectViaAPI(`${testId}-Alpha`);
  await helpers.createProjectViaAPI(`${testId}-Beta`);
  await helpers.createProjectViaAPI(`${testId}-Gamma`);

  await page.goto('/');

  // Assert ONLY on YOUR data, ignore others
  await helpers.verifyProjectExists(`${testId}-Alpha`);
  await helpers.verifyProjectExists(`${testId}-Beta`);
  await helpers.verifyProjectExists(`${testId}-Gamma`);

  // Don't assert total count - just verify your projects exist
  const myProjects = page.locator('[data-testid="project-card"]').filter({ hasText: testId });
  await expect(myProjects).toHaveCount(3);
});
```

**Pros:**

- ✅ Robust, parallel-safe
- ✅ Realistic (production has data too!)
- ✅ No database cleanup needed
- ✅ Tests are truly independent

**Cons:**

- ❌ Slightly more complex assertions
- ❌ Can't test "empty state" scenarios easily
- ❌ Database grows over time

---

### 7. Hybrid Approach ⭐⭐ (RECOMMENDED)

**Concept:** Combine unique namespaces + scoped cleanup + smart grouping.

**Full Implementation:**

```typescript
// test-helpers.ts
export class ProjectHelpers {
  private testId: string;
  private createdProjectIds: number[] = [];

  constructor(page: Page, testId?: string) {
    // Generate unique test ID if not provided
    this.testId = testId || `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.page = page;
  }

  // Auto-prefix all created projects with test ID
  async createProjectViaAPI(name: string, description = '', status = 'planned') {
    const prefixedName = name.startsWith(this.testId) ? name : `${this.testId}-${name}`;

    const project = await api.post('/api/projects', {
      name: prefixedName,
      description,
      status,
    });

    this.createdProjectIds.push(project.id);
    return project;
  }

  // Create via UI - automatically prefixes name
  async createProjectViaUI(name: string, description?: string) {
    const prefixedName = `${this.testId}-${name}`;
    await this.page.getByRole('button', { name: /create new project/i }).click();
    await this.page.getByLabel(/project name/i).fill(prefixedName);
    if (description) {
      await this.page.getByLabel(/description/i).fill(description);
    }
    await this.page.getByRole('button', { name: /create project/i }).click();

    // Wait for project to appear
    await this.page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: prefixedName })
      .waitFor({ state: 'visible' });
  }

  // Get only YOUR test's projects
  async getMyProjects(): Promise<Project[]> {
    const all = await this.getAllProjectsViaAPI();
    return all.filter((p) => p.name.startsWith(this.testId));
  }

  // Verify exists (automatically handles prefix)
  async verifyProjectExists(name: string) {
    const fullName = name.startsWith(this.testId) ? name : `${this.testId}-${name}`;
    const card = this.page.locator('[data-testid="project-card"]').filter({ hasText: fullName });
    await expect(card).toBeVisible({ timeout: 5000 });
  }

  // Verify doesn't exist
  async verifyProjectNotExists(name: string) {
    const fullName = name.startsWith(this.testId) ? name : `${this.testId}-${name}`;
    const card = this.page.locator('[data-testid="project-card"]').filter({ hasText: fullName });
    await expect(card).not.toBeVisible();
  }

  // Count only YOUR projects in UI
  async getMyProjectCountFromUI(): Promise<number> {
    const myCards = this.page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: this.testId });
    return myCards.count();
  }

  // Cleanup only YOUR test's data
  async cleanup() {
    for (const id of this.createdProjectIds) {
      try {
        await this.deleteProjectViaAPI(id);
      } catch (e) {
        console.warn(`Failed to cleanup project ${id}:`, e);
      }
    }
    this.createdProjectIds = [];
  }

  // Get the test ID (useful for custom assertions)
  getTestId(): string {
    return this.testId;
  }
}

// Setup function - no database clearing!
export async function setupTest(
  page: Page,
  options?: { testId?: string }
): Promise<ProjectHelpers> {
  const helpers = new ProjectHelpers(page, options?.testId);
  return helpers;
}
```

**Test Usage:**

```typescript
test.describe('Project Management', () => {
  let helpers: ProjectHelpers;

  test.beforeEach(async ({ page }) => {
    // No database clearing - just create unique helper
    helpers = await setupTest(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // Clean up only this test's data
    await helpers.cleanup();
  });

  test('should display projects', async ({ page }) => {
    // Create with simple names - auto-prefixed internally
    await helpers.createProjectViaAPI('Alpha');
    await helpers.createProjectViaAPI('Beta');
    await helpers.createProjectViaAPI('Gamma');

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify - automatically looks for prefixed names
    await helpers.verifyProjectExists('Alpha');
    await helpers.verifyProjectExists('Beta');
    await helpers.verifyProjectExists('Gamma');

    // Count only YOUR projects
    const count = await helpers.getMyProjectCountFromUI();
    expect(count).toBe(3);
  });

  test('should delete project', async ({ page }) => {
    await helpers.createProjectViaAPI('To Delete');
    await page.reload();

    // Helper handles finding the prefixed name
    await helpers.deleteProjectViaUI('To Delete');

    await helpers.verifyProjectNotExists('To Delete');
  });
});
```

**Special Cases - Empty State Tests:**

```typescript
test.describe('Empty State Tests', () => {
  // These need special handling - can run sequentially
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    // Optional: Full database cleanup for empty state tests
    const page = await browser.newPage();
    const helpers = new ProjectHelpers(page);
    await helpers.clearDatabase(); // Full clear
    await page.close();
  });

  test('should show empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/No projects|Get started/')).toBeVisible();
  });
});
```

**Configuration:**

```typescript
// playwright.config.ts
export default defineConfig({
  // Enable parallelism for speed
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,

  // Add retries for reliability
  retries: process.env.CI ? 2 : 1,

  // Separate sequential tests if needed
  projects: [
    {
      name: 'setup',
      testMatch: '**/setup.spec.ts',
      fullyParallel: false,
      workers: 1,
    },
    {
      name: 'parallel-tests',
      testMatch: '**/*.spec.ts',
      testIgnore: '**/setup.spec.ts',
      dependencies: ['setup'],
      fullyParallel: true,
    },
  ],
});
```

**Benefits:**

- ✅ Tests run in parallel (4x faster!)
- ✅ No test interference (unique IDs)
- ✅ Realistic (tests work with existing data like production)
- ✅ Easy cleanup (only delete your own data)
- ✅ No complex infrastructure (no multiple DBs)
- ✅ Tests are readable (simple names in test code)
- ✅ Automatic prefixing (hidden in helpers)

**Trade-offs:**

- ⚠️ Database grows over time (need periodic cleanup)
- ⚠️ Empty state tests need special handling
- ⚠️ Test names visible in UI include prefix (acceptable)

---

### 8. Multi-User Profile Isolation 🎭 (Enterprise-Ready)

**Concept:** Each test runs as a different "user" with their own isolated data space.

**Backend Implementation:**

```python
# backend/app/models.py
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50))

    # Add user/tenant isolation
    user_id = Column(String(100), index=True)  # Test user identifier
    tenant_id = Column(String(100), index=True)  # For multi-tenancy

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

# backend/app/main.py
@app.get("/api/projects")
async def get_projects(
    user_id: str = Header(default="default"),  # Get from header
    db: Session = Depends(get_db)
):
    """Get projects for specific user/tenant"""
    projects = db.query(Project)\
        .filter(Project.user_id == user_id)\
        .order_by(Project.created_at.desc())\
        .all()
    return projects

@app.post("/api/projects")
async def create_project(
    project: ProjectCreate,
    user_id: str = Header(default="default"),
    db: Session = Depends(get_db)
):
    """Create project for specific user/tenant"""
    db_project = Project(
        name=project.name,
        description=project.description,
        status=project.status,
        user_id=user_id  # Isolate by user
    )
    db.add(db_project)
    db.commit()
    return db_project
```

**Frontend Implementation (Optional):**

```typescript
// frontend/app/lib/api.ts
let testUserId: string | null = null;

export function setTestUserId(userId: string) {
  testUserId = userId;
}

export async function getProjects(): Promise<Project[]> {
  const headers: HeadersInit = {};
  if (testUserId) {
    headers['user-id'] = testUserId; // Pass user context
  }

  const response = await fetch(`${API_URL}/api/projects`, { headers });
  return response.json();
}
```

**E2E Test Implementation:**

```typescript
// test-helpers.ts
export class ProjectHelpers {
  private userId: string;

  constructor(page: Page, userId?: string) {
    // Each test gets unique user ID
    this.userId = userId || `test-user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.page = page;
  }

  // Set user context for all API calls
  async createProjectViaAPI(name: string, description = '', status = 'planned') {
    const response = await this.page.request.post('/api/projects', {
      headers: {
        'user-id': this.userId, // Isolate by user
      },
      data: { name, description, status },
    });
    return response.json();
  }

  // Get only this user's projects
  async getAllProjectsViaAPI(): Promise<Project[]> {
    const response = await this.page.request.get('/api/projects', {
      headers: {
        'user-id': this.userId,
      },
    });
    return response.json();
  }

  // Set user context in browser for UI tests
  async setUserContext() {
    await this.page.evaluate((userId) => {
      // Inject user ID into frontend
      (window as any).__TEST_USER_ID__ = userId;
      localStorage.setItem('test-user-id', userId);
    }, this.userId);
  }

  // Cleanup only this user's data
  async cleanup() {
    const projects = await this.getAllProjectsViaAPI();
    for (const project of projects) {
      await this.page.request.delete(`/api/projects/${project.id}`, {
        headers: { 'user-id': this.userId },
      });
    }
  }

  getUserId(): string {
    return this.userId;
  }
}

// Setup with user context
export async function setupTest(
  page: Page,
  options?: { userId?: string }
): Promise<ProjectHelpers> {
  const helpers = new ProjectHelpers(page, options?.userId);
  await helpers.setUserContext();
  return helpers;
}
```

**Test Usage:**

```typescript
test.describe('Project Management - Multi User', () => {
  let helpers: ProjectHelpers;

  test.beforeEach(async ({ page }) => {
    // Each test gets a unique user automatically
    helpers = await setupTest(page);
    await page.goto('/');
  });

  test.afterEach(async () => {
    await helpers.cleanup();
  });

  test('should isolate projects per user', async ({ page }) => {
    // This test's user sees only their data
    await helpers.createProjectViaAPI('My Project');
    await page.reload();

    await helpers.verifyProjectExists('My Project');

    const count = await helpers.getMyProjectCountFromUI();
    expect(count).toBe(1); // Only sees own project
  });

  test('multiple users can have same project names', async ({ page }) => {
    // Create another user's helper
    const user1 = await setupTest(page, { userId: 'user-1' });
    const user2 = await setupTest(page, { userId: 'user-2' });

    // Both users create projects with same name - no conflict!
    await user1.createProjectViaAPI('My Video');
    await user2.createProjectViaAPI('My Video');

    // User 1 sees only their project
    const user1Projects = await user1.getAllProjectsViaAPI();
    expect(user1Projects).toHaveLength(1);

    // User 2 sees only their project
    const user2Projects = await user2.getAllProjectsViaAPI();
    expect(user2Projects).toHaveLength(1);
  });
});
```

**Advanced: Simulate Real Multi-User Scenarios**

```typescript
test.describe('Multi-User Collaboration Tests', () => {
  test('should handle concurrent users without conflicts', async ({ browser }) => {
    // Simulate 3 users working simultaneously
    const users = await Promise.all([
      browser.newPage().then(async (page) => {
        const helper = await setupTest(page, { userId: 'alice' });
        return { page, helper, name: 'Alice' };
      }),
      browser.newPage().then(async (page) => {
        const helper = await setupTest(page, { userId: 'bob' });
        return { page, helper, name: 'Bob' };
      }),
      browser.newPage().then(async (page) => {
        const helper = await setupTest(page, { userId: 'charlie' });
        return { page, helper, name: 'Charlie' };
      }),
    ]);

    // All users create projects concurrently
    await Promise.all(
      users.map(({ helper, name }) => helper.createProjectViaAPI(`${name}'s Project`))
    );

    // Each user sees only their own project
    for (const { helper, name, page } of users) {
      await page.goto('/');
      const projects = await helper.getAllProjectsViaAPI();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe(`${name}'s Project`);
    }

    // Cleanup
    await Promise.all(users.map(({ helper, page }) => helper.cleanup().then(() => page.close())));
  });
});
```

**Pros:**

- ✅ **Perfect Isolation:** Each test is truly independent
- ✅ **Realistic:** Mirrors real multi-tenant applications
- ✅ **Scalable:** Can test concurrent user scenarios
- ✅ **No Naming Conflicts:** Different users can have same project names
- ✅ **Production-Ready:** Pattern used in real SaaS apps
- ✅ **Fast:** Full parallelism with zero interference
- ✅ **Clean Database:** Only see your user's data
- ✅ **Easy Cleanup:** Delete all data for a user ID

**Cons:**

- ❌ **Backend Changes Required:** Need to add user_id column and filtering
- ❌ **Migration Needed:** Existing data needs user_id
- ❌ **More Complex:** Additional header management
- ❌ **Database Growth:** Still accumulates data (but isolated)

**When to Use:**

- ✅ Multi-tenant applications
- ✅ Large test suites with many parallel tests
- ✅ Testing user-specific features
- ✅ When planning for authentication/authorization
- ✅ Enterprise applications with user contexts

**Migration Path:**

```sql
-- Add user_id column with default for existing data
ALTER TABLE projects ADD COLUMN user_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE projects ADD INDEX idx_user_id (user_id);

-- Update existing projects to have user_id
UPDATE projects SET user_id = 'default' WHERE user_id IS NULL;
```

---

### 9. Hybrid Multi-User Approach ⭐⭐⭐ (ULTIMATE)

**Concept:** Combine user profiles with test namespaces for maximum flexibility.

**Implementation:**

```typescript
export class ProjectHelpers {
  private userId: string;
  private testId: string;

  constructor(page: Page, options?: { userId?: string; testId?: string }) {
    // User ID for backend isolation
    this.userId = options?.userId || `test-user-${Date.now()}`;

    // Test ID for additional frontend isolation (optional)
    this.testId = options?.testId || '';

    this.page = page;
  }

  async createProjectViaAPI(name: string, description = '', status = 'planned') {
    // Optionally prefix name for extra isolation
    const finalName = this.testId ? `${this.testId}-${name}` : name;

    const response = await this.page.request.post('/api/projects', {
      headers: { 'user-id': this.userId },
      data: { name: finalName, description, status },
    });
    return response.json();
  }
}
```

**Benefits:**

- ✅ Backend isolation via user_id (primary mechanism)
- ✅ Optional frontend namespacing (if needed)
- ✅ Can test with or without authentication
- ✅ Gradual migration path (add user_id when ready)
- ✅ Maximum flexibility

---

## Decision Matrix

| Strategy              | Parallel Speed | Simplicity    | No Data Growth  | Empty State Tests | Backend Changes |
| --------------------- | -------------- | ------------- | --------------- | ----------------- | --------------- |
| Current (Sequential)  | ❌ Slow        | ✅ Simple     | ✅ Clean        | ✅ Easy           | ✅ None         |
| Unique Namespaces     | ✅ Fast        | ✅ Simple     | ❌ Grows        | ❌ Hard           | ✅ None         |
| Scoped Cleanup        | ✅ Fast        | ⚠️ Medium     | ✅ Clean        | ❌ Hard           | ✅ None         |
| Test Groups           | ⚠️ Medium      | ❌ Complex    | ✅ Clean        | ✅ Easy           | ✅ None         |
| DB Per Worker         | ✅ Fast        | ❌ Complex    | ✅ Clean        | ✅ Easy           | ⚠️ Config       |
| Idempotent            | ✅ Fast        | ⚠️ Medium     | ❌ Grows        | ❌ Hard           | ✅ None         |
| Hybrid (Namespace)    | ✅ **Fast**    | ✅ **Simple** | ⚠️ **Periodic** | ⚠️ **Special**    | ✅ **None**     |
| **Multi-User** 🎭     | ✅ **Fast**    | ✅ **Simple** | ⚠️ **Periodic** | ✅ **Easy**       | ❌ **Required** |
| **Hybrid Multi-User** | ✅ **Fast**    | ✅ **Simple** | ⚠️ **Periodic** | ✅ **Easy**       | ❌ **Required** |

## Comparison: Multi-User vs Namespace Isolation

### When to Use Multi-User Profile Isolation 🎭

**Best For:**

- ✅ Applications planning to add authentication/user accounts
- ✅ Multi-tenant SaaS applications
- ✅ Testing user-specific features and permissions
- ✅ Large teams with many parallel tests running
- ✅ When you want production-like isolation

**Example Scenarios:**

```typescript
// Perfect for multi-user scenarios
test('user A cannot see user B projects', async ({ page }) => {
  const userA = await setupTest(page, { userId: 'user-a' });
  const userB = await setupTest(page, { userId: 'user-b' });

  await userA.createProjectViaAPI('Secret Project');

  // User B's query returns empty - perfect isolation
  const userBProjects = await userB.getAllProjectsViaAPI();
  expect(userBProjects).toHaveLength(0);
});
```

### When to Use Namespace Isolation (Hybrid #7)

**Best For:**

- ✅ Simple applications without user accounts
- ✅ Quick implementation (no backend changes)
- ✅ Single-tenant applications
- ✅ Prototypes and MVP testing
- ✅ When you want minimal setup

**Example Scenarios:**

```typescript
// Works well for simple isolation
test('should create multiple projects', async ({ page }) => {
  const helpers = await setupTest(page); // Auto-generates testId

  await helpers.createProjectViaAPI('Project 1'); // Creates "test-123-Project 1"
  await helpers.createProjectViaAPI('Project 2'); // Creates "test-123-Project 2"

  const count = await helpers.getMyProjectCountFromUI();
  expect(count).toBe(2);
});
```

### Hybrid Approach: Best of Both Worlds

**Implementation Strategy:**

1. **Phase 1:** Start with namespace isolation (quick win)
2. **Phase 2:** Add user_id column to database
3. **Phase 3:** Migrate to multi-user isolation
4. **Phase 4:** Keep namespace as backup/optional layer

**Code Example:**

```typescript
export class ProjectHelpers {
  private userId?: string;
  private testId?: string;

  constructor(page: Page, options?: {
    isolationMode?: 'namespace' | 'user' | 'both',
    userId?: string,
    testId?: string
  }) {
    const mode = options?.isolationMode || 'namespace';

    if (mode === 'user' || mode === 'both') {
      this.userId = options?.userId || `test-user-${Date.now()}`;
    }

    if (mode === 'namespace' || mode === 'both') {
      this.testId = options?.testId || `test-${Date.now()}`;
    }
  }

  async createProjectViaAPI(name: string) {
    // Build name with namespace if enabled
    const finalName = this.testId ? `${this.testId}-${name}` : name;

    // Build headers with user if enabled
    const headers: Record<string, string> = {};
    if (this.userId) {
      headers['user-id'] = this.userId;
    }

    return this.page.request.post('/api/projects', {
      headers,
      data: { name: finalName, ... }
    });
  }
}
```

---

## Recommendation

**Use Hybrid Approach (#7)** for this project because:

1. **Fast Execution:** Tests run in parallel (4x speed improvement)
2. **Simple Implementation:** Auto-prefixing hidden in helpers
3. **Reliable:** No test interference, each test isolated
4. **Maintainable:** Easy to understand and extend
5. **Realistic:** Tests work with existing data (like production)

**Implementation Steps:**

1. Update `ProjectHelpers` class with auto-prefixing
2. Remove database clearing from `setupTest()`
3. Add `cleanup()` to `test.afterEach()`
4. Update `playwright.config.ts` to enable parallel execution
5. Handle empty state tests separately (sequential or full cleanup)

**Periodic Maintenance:**

- Add cleanup script to delete old test data weekly
- Monitor database size
- Consider TTL on test data (delete data older than 1 week)

---

## Future Enhancements

### Automatic Cleanup Script

```typescript
// cleanup-test-data.ts
async function cleanupOldTestData() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days old

  const projects = await getAllProjects();
  const testProjects = projects.filter(
    (p) => p.name.startsWith('test-') && new Date(p.created_at) < cutoffDate
  );

  for (const project of testProjects) {
    await deleteProject(project.id);
  }

  console.log(`Cleaned up ${testProjects.length} old test projects`);
}
```

### Database Seeding for Performance Tests

```typescript
// seed-database.ts
async function seedDatabase() {
  const helpers = new ProjectHelpers(page, 'seed');

  // Create realistic data set
  for (let i = 0; i < 100; i++) {
    await helpers.createProjectViaAPI(`Performance Test ${i}`);
  }
}
```

---

## Related Documentation

- [Playwright Test Isolation](https://playwright.dev/docs/test-parallel)
- [Project Management Testing Strategy](./PROJECT_FEATURE_TEST_PLAN.md)
- [Test Helpers API](../helpers/test-helpers.ts)

---

**Last Updated:** 2025-10-25  
**Status:** Proposed (Not yet implemented)  
**Next Steps:** Get approval and implement Hybrid Approach
