# Unit Testing Checklist

Use this checklist to ensure comprehensive test coverage and quality for all code changes.

---

## Core Testing Principles

### Coverage Goals

- ✅ **NEW CODE MUST HAVE 100% COVERAGE** - All new changes should be covered as close to 100% as possible
- ✅ **AIM FOR 100% REGARDLESS OF THRESHOLDS** - Don't settle for meeting minimums; strive for perfection
- ✅ **TRY MULTIPLE APPROACHES** - If you can't get 100% on the first few tries, try again with different strategies
- ✅ **REFACTOR FOR TESTABILITY** - Think of ways to refactor code to make it more testable
- ✅ **REMOVE UNREACHABLE CODE** - Delete code that cannot be reached or tested

### Test Comprehensiveness

Every function, method, and code path must be tested for:

#### 1. **Happy Path Testing**
- ✅ Normal, expected inputs and outputs
- ✅ Successful execution scenarios
- ✅ Valid data flow through the system

#### 2. **Edge Cases**
- ✅ Boundary values (min/max numbers, empty collections, single items)
- ✅ Unusual but valid input combinations
- ✅ Race conditions and timing issues
- ✅ Large datasets or extreme values
- ✅ Optional parameters (provided vs omitted)

#### 3. **Error Handling**
- ✅ `null` values
- ✅ `undefined` values
- ✅ Empty strings (`""`)
- ✅ Empty arrays (`[]`)
- ✅ Empty objects (`{}`)
- ✅ Missing required parameters
- ✅ Invalid data types
- ✅ Out-of-range values
- ✅ Malformed data
- ✅ Network failures (API calls)
- ✅ Database errors
- ✅ File system errors

#### 4. **Bad Inputs (Negative Testing)**
- ✅ Inputs that should cause failures
- ✅ Invalid formats
- ✅ SQL injection attempts (if applicable)
- ✅ XSS attempts (if applicable)
- ✅ Buffer overflow attempts
- ✅ Incorrect authentication/authorization

---

## Testing Workflow

### Before Writing Tests

1. **Understand the Code**
   - Read all new/modified code thoroughly
   - Identify all code paths and branches
   - Note all error handling paths
   - List all edge cases

2. **Check Current Coverage**
   ```bash
   # Frontend
   npm test -- --coverage
   
   # Backend
   pytest --cov=app --cov-report=html --cov-report=term
   ```

3. **Identify Coverage Gaps**
   - Review coverage reports (HTML reports are most detailed)
   - Note uncovered lines, branches, and functions
   - Prioritize critical paths

### While Writing Tests

1. **Follow Best Practices**
   - One assertion per test (when possible)
   - Clear, descriptive test names that explain what's being tested
   - Arrange-Act-Assert (AAA) pattern
   - Use meaningful test data
   - Mock external dependencies appropriately
   - Test in isolation (unit tests should not depend on each other)

2. **Test Structure**
   ```typescript
   // Good test structure
   describe('ComponentName', () => {
     describe('methodName', () => {
       it('should handle normal case', () => {
         // Arrange - Set up test data
         // Act - Call the method
         // Assert - Verify results
       });
       
       it('should handle null input', () => { /* ... */ });
       it('should handle empty string', () => { /* ... */ });
       it('should throw error for invalid input', () => { /* ... */ });
     });
   });
   ```

3. **Iterate Until 100%**
   - Run tests after each addition
   - Check coverage after each test
   - If coverage is < 100%, identify gaps and add tests
   - Repeat until all lines/branches are covered

### After Writing Tests

1. **Verify Coverage Metrics**
   ```bash
   # Ensure all metrics are at 100% for new code
   # Check: Lines, Statements, Branches, Functions
   ```

2. **Review Test Quality**
   - Are edge cases covered?
   - Are error cases covered?
   - Are tests readable and maintainable?
   - Do tests actually test behavior, not implementation?

3. **Run All Tests**
   ```bash
   # Frontend
   npm test
   
   # Backend
   pytest
   
   # E2E (if applicable)
   npm run test:e2e
   ```

---

## Common Coverage Problems & Solutions

### Problem: "I can't reach 100% coverage"

**Solutions:**
1. ✅ **Refactor the code** - Break down complex functions into smaller, testable units
2. ✅ **Remove dead code** - Delete unreachable code paths
3. ✅ **Add error handling tests** - Test all catch blocks and error paths
4. ✅ **Test async code properly** - Use `async/await` or return promises in tests
5. ✅ **Test all branches** - Ensure if/else, switch cases, ternaries are all tested
6. ✅ **Mock dependencies correctly** - Ensure mocks don't hide untested code
7. ✅ **ASK FOR HELP** - If stuck, ask how to improve coverage without compromising quality

### Problem: "The code is too complex to test"

**Solutions:**
1. ✅ **Refactor for simplicity** - Break into smaller functions
2. ✅ **Extract dependencies** - Use dependency injection
3. ✅ **Separate concerns** - Split business logic from framework code
4. ✅ **Consider redesign** - Complex code is often poorly designed code

### Problem: "Tests are failing"

**Solutions:**
1. ✅ **Fix the code, not the test** - Failing tests usually indicate bugs
2. ✅ **Update implementation** - Don't bypass tests with `--no-verify`
3. ✅ **Ask for clarification** - If unsure about expected behavior, ask

---

## Absolute "NEVERS"

### ❌ NEVER Lower Coverage Thresholds

**Wrong:**
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 95  // Lowered from 98
    }
  }
}
```

**Right:**
```
Ask: "I'm having trouble reaching 98% branch coverage. Can you help me 
understand what branches I'm missing and how to test them?"
```

### ❌ NEVER Use `--no-verify`

**Wrong:**
```bash
git commit --no-verify -m "quick fix"
```

**Right:**
```bash
# Fix the issues that prevent commit
npm test
npm run lint
git commit -m "fix: proper commit with all checks passing"
```

### ❌ NEVER Exclude Files from Coverage

**Wrong:**
```json
{
  "coveragePathIgnorePatterns": [
    "src/NewFeature.ts"  // Added to hide low coverage
  ]
}
```

**Right:**
```
Write tests for src/NewFeature.ts until it has 100% coverage
```

### ❌ NEVER Skip Tests to Make CI Pass

**Wrong:**
```typescript
it.skip('should handle error case', () => { /* ... */ });
```

**Right:**
```typescript
it('should handle error case', () => { 
  // Implement the test properly
});
```

### ❌ NEVER Mock Everything to Avoid Testing

**Wrong:**
```typescript
jest.mock('./myModule', () => ({
  complexFunction: jest.fn(() => 'mocked')  // Hiding untested code
}));
```

**Right:**
```typescript
// Test the actual implementation
import { complexFunction } from './myModule';
// Write proper tests for complexFunction
```

---

## Best Practices Checklist

### Before Committing

- [ ] All new code has 100% coverage (lines, branches, functions)
- [ ] All edge cases are tested
- [ ] All error cases are tested
- [ ] All null/undefined/empty cases are tested
- [ ] All bad inputs are tested
- [ ] Tests follow AAA pattern
- [ ] Test names are clear and descriptive
- [ ] No tests are skipped (`.skip` or `.todo`)
- [ ] No coverage thresholds were lowered
- [ ] No files excluded from coverage
- [ ] No `--no-verify` flags used
- [ ] All tests pass locally
- [ ] Coverage reports reviewed (HTML format)

### During Code Review

- [ ] New tests are comprehensive
- [ ] Tests are maintainable and readable
- [ ] Tests don't over-mock (test real behavior)
- [ ] Coverage is 100% for new code
- [ ] No regression in existing coverage

---

## Quick Reference Commands

### Frontend (Jest)

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests for specific file
npm test -- path/to/test.test.ts

# Run tests in watch mode
npm test -- --watch

# View detailed HTML coverage report
open coverage/lcov-report/index.html
```

### Backend (pytest)

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test file
pytest tests/test_file.py

# Run with verbose output
pytest -v

# View detailed HTML coverage report
open htmlcov/index.html
```

### E2E (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e -- --ui

# Run specific test file
npm run test:e2e -- tests/example.spec.ts
```

---

## Getting Help

If you're struggling to achieve 100% coverage or write proper tests:

1. **ASK QUESTIONS** - Don't guess, don't bypass, don't lower standards
2. **EXPLAIN THE PROBLEM** - Describe what coverage you're missing and what you've tried
3. **SHARE CODE SNIPPETS** - Show the uncovered code
4. **REQUEST GUIDANCE** - Ask for suggestions on refactoring or test approaches

**Example:**
```
I'm trying to test the error handling in the createWorkspace function, 
but I can't figure out how to trigger the catch block. I've tried 
mocking the API to throw an error, but the coverage report still shows 
line 45 as uncovered. Can you help me understand what I'm missing?
```

---

## Remember

- **Quality over speed** - Take time to write comprehensive tests
- **100% coverage is the goal** - Don't settle for "good enough"
- **Tests are documentation** - They show how code should be used
- **Tests prevent regressions** - They protect against future bugs
- **Ask for help** - Don't compromise quality to save time

**CRITICAL**: If you cannot achieve 100% coverage for new code, there is likely a problem with the code design, not the tests. Consider refactoring before lowering standards.
