# Frontend Testing Setup

**Date**: October 21, 2025  
**Status**: ✅ Complete - Jest & React Testing Library installed and configured

## Overview

Successfully set up a comprehensive testing framework for the Next.js frontend using Jest and React Testing Library. This mirrors the backend's pytest setup with similar coverage requirements and best practices.

## Installed Dependencies

```json
{
  "devDependencies": {
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^1.0.0"
  }
}
```

## Configuration Files

### 1. `jest.config.mjs`

- Next.js-aware Jest configuration
- Code coverage thresholds (80% global)
- Test environment: jsdom
- Coverage collection from `app/**/*.{js,jsx,ts,tsx}`
- Module path aliases support

### 2. `jest.setup.js`

- Imports `@testing-library/jest-dom` for enhanced matchers
- Provides custom matchers like `toBeInTheDocument()`, `toBeDisabled()`, etc.

## npm Scripts

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Test Files

### ✅ ProjectForm Tests (`app/components/__tests__/ProjectForm.test.tsx`)

**18 Tests - All Passing**

#### Test Coverage:

1. **Rendering** (3 tests)
   - Form renders with all fields
   - Cancel button visibility based on props
2. **Form Validation** (3 tests)
   - Submit button disabled when title empty
   - Submit button enabled when title provided
   - MaxLength validation (255 characters)
3. **Form Submission** (5 tests)
   - API called with correct data
   - Success message displayed
   - Form resets after submission
   - onSuccess callback invoked
   - Form disabled during submission
4. **Error Handling** (3 tests)
   - API errors displayed
   - Duplicate title errors handled
   - Generic error for unexpected errors
5. **Form Actions** (2 tests)
   - Cancel button functionality
   - Form clears on cancel
6. **Status Selection** (2 tests)
   - Default status is "planned"
   - Status can be changed

## Coverage Report

### Current Coverage (as of Oct 21, 2025)

| File                | Statements | Branches | Functions | Lines  | Status         |
| ------------------- | ---------- | -------- | --------- | ------ | -------------- |
| **ProjectForm.tsx** | 97.67%     | 90.47%   | 100%      | 97.67% | ✅ Excellent   |
| **project.ts**      | 100%       | 100%     | 100%      | 100%   | ✅ Perfect     |
| **api.ts**          | 30.76%     | 25%      | 0%        | 30.76% | ⚠️ Needs tests |
| **page.tsx**        | 0%         | 0%       | 0%        | 0%     | ❌ Not tested  |
| **Overall**         | 48.14%     | 42%      | 32%       | 48.11% | 📈 In Progress |

### Coverage Thresholds (jest.config.mjs)

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## Testing Best Practices

### 1. **Component Testing Approach**

- Test user interactions, not implementation details
- Use `screen.getByRole()` and `screen.getByLabelText()` for accessible queries
- Test from the user's perspective
- Mock API calls to avoid external dependencies

### 2. **Mocking Strategy**

```typescript
// Mock API module
jest.mock("../../lib/api");

// Create proper ApiError instances
const apiError = Object.create(api.ApiError.prototype);
apiError.message = "Error message";
apiError.status = 400;
apiError.details = { detail: "Specific error" };

// Mock implementation
(api.createProject as jest.Mock).mockRejectedValue(apiError);
```

### 3. **Async Testing**

```typescript
await user.type(input, "text");
await user.click(button);

await waitFor(() => {
  expect(screen.getByText(/expected text/i)).toBeInTheDocument();
});
```

### 4. **Test Organization**

- Group related tests with `describe()` blocks
- Use descriptive test names with `it('should ...')`
- Clear arrangement: setup → action → assertion
- Clean up with `beforeEach()` and `afterEach()`

## Next Steps

### Immediate

- [ ] Write tests for `api.ts` module (API client functions)
- [ ] Write tests for `page.tsx` (main page component)
- [ ] Achieve 80% overall coverage threshold

### Future Enhancements

- [ ] Add integration tests for complete user flows
- [ ] Set up CI/CD to run tests automatically
- [ ] Add visual regression testing
- [ ] Configure pre-commit hook to run frontend tests
- [ ] Add snapshot tests for UI components
- [ ] Test error boundaries
- [ ] Test loading states and transitions

## Example Test Structure

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Component from '../Component'
import * as api from '../../lib/api'

jest.mock('../../lib/api')

describe('Component Name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Feature Group', () => {
    it('should do something specific', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockData = { /* ... */ }
      ;(api.someFunction as jest.Mock).mockResolvedValue(mockData)

      // Act
      render(<Component />)
      await user.click(screen.getByRole('button'))

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/expected/i)).toBeInTheDocument()
      })
    })
  })
})
```

## Troubleshooting

### Common Issues

**1. `toBeInTheDocument is not a function`**

- Ensure `jest.setup.js` imports `@testing-library/jest-dom`
- Check that `setupFilesAfterEnv` is configured in `jest.config.mjs`

**2. Mock not working**

- Verify mock path matches import path
- Use `jest.clearAllMocks()` in `beforeEach()`
- Check that `jest.mock()` is called before imports

**3. Timeout errors in async tests**

- Increase timeout in `waitFor()`: `{ timeout: 2000 }`
- Ensure async operations complete
- Check that mocks return promises

**4. Can't find element**

- Use `screen.debug()` to see rendered output
- Try different query methods (`getByRole`, `getByLabelText`, `getByText`)
- Check for timing issues with `waitFor()`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- ProjectForm.test

# Update snapshots
npm test -- -u

# Run tests in CI mode
CI=true npm test
```

## Integration with Backend

The frontend testing setup mirrors the backend's approach:

| Backend (Python)               | Frontend (JavaScript)               |
| ------------------------------ | ----------------------------------- |
| pytest                         | Jest                                |
| pytest-cov                     | Jest --coverage                     |
| 95% coverage threshold         | 80% coverage threshold              |
| Unit tests / Integration tests | Component tests / Integration tests |
| Pre-commit hook runs tests     | (To be configured)                  |

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Summary**: Testing infrastructure is fully set up and working. The ProjectForm component has excellent test coverage (97.67%). Next priority is to test the remaining components and achieve the 80% coverage threshold.
