This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Code Quality

This project enforces code quality through linting and formatting tools.

### Linting with ESLint

ESLint is configured with Next.js and TypeScript support, plus Prettier integration to avoid conflicts.

```bash
# Run ESLint to check for issues
npm run lint

# Automatically fix fixable issues
npm run lint:fix
```

**Configuration files:**

- `eslint.config.mjs` - ESLint configuration
- Extends: `next/core-web-vitals`, `next/typescript`, `prettier`

### Code Formatting with Prettier

Prettier ensures consistent code style across the entire codebase.

```bash
# Format all code files
npm run format

# Check if code is properly formatted (without changing files)
npm run format:check
```

**Configuration files:**

- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to exclude from formatting

**Prettier settings:**

- **Semi-colons**: Required (`;`)
- **Quotes**: Double quotes (`"`)
- **Trailing commas**: ES5 style
- **Print width**: 80 characters
- **Tab width**: 2 spaces
- **Arrow parens**: Always

### Pre-commit Checks

Before each commit, the following checks run automatically via `.githooks/pre-commit`:

1. **Prettier formatting check** - Ensures all code is formatted
2. **ESLint** - Checks for linting errors
3. **Unit tests with coverage** - All tests must pass with 98%+ coverage

**If checks fail:**

- Format code: `npm run format`
- Fix linting: `npm run lint:fix`
- Fix tests: Ensure all tests pass and meet coverage thresholds

**Note:** You cannot commit code that fails these checks. This ensures code quality is maintained across the project.

## Testing

This project uses Jest and React Testing Library for unit testing with strict coverage requirements.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Coverage Requirements

All code must meet these coverage thresholds:

- **Statements**: 98%
- **Branches**: 98%
- **Functions**: 98%
- **Lines**: 98%

The coverage thresholds are enforced in `jest.config.mjs` and will cause tests to fail if not met.

### Writing Tests

Tests should be placed in `__tests__` directories adjacent to the code they test:

```
app/
  components/
    ProjectForm.tsx
    __tests__/
      ProjectForm.test.tsx
  lib/
    api.ts
    __tests__/
      api.test.ts
  page.tsx
  __tests__/
    page.test.tsx
```

### Test Structure

Follow this pattern when writing tests:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentToTest } from '../ComponentToTest';

describe('ComponentToTest', () => {
  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange: Set up test data and mocks
      const mockFn = jest.fn();

      // Act: Render component and interact
      render(<ComponentToTest onAction={mockFn} />);
      const button = screen.getByRole('button', { name: /click me/i });
      fireEvent.click(button);

      // Assert: Verify expected behavior
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Best Practices

1. **Test user behavior, not implementation details**
   - Use `screen.getByRole()`, `screen.getByLabelText()`, etc.
   - Avoid testing internal state or implementation

2. **Mock external dependencies**
   - Mock API calls with `jest.mock()`
   - Mock Next.js router and other framework features

3. **Group related tests with `describe()` blocks**
   - Organize by feature or functionality
   - Use nested `describe()` for sub-features

4. **Write descriptive test names**
   - Use "should..." pattern: `it('should display error when API fails', ...)`
   - Make test failures easy to understand

5. **Test error states and edge cases**
   - Empty states, loading states, error states
   - Invalid inputs, boundary conditions

6. **Aim for 100% coverage**
   - Use coverage report to identify untested code
   - View HTML report: `open htmlcov/index.html` (generated after `npm run test:coverage`)

### Viewing Coverage Reports

After running `npm run test:coverage`, view the detailed HTML report:

```bash
# Open the coverage report in your browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

The report shows:

- Line-by-line coverage with uncovered lines highlighted
- Branch coverage details
- Function coverage

### Pre-commit Hook

Tests run automatically before each commit via git hooks. See `../.githooks/README.md` for details.

If tests fail, the commit will be blocked. Fix the tests before committing:

- All tests must pass
- Coverage thresholds (98%) must be met

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
