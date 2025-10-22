# Git Hooks

This directory contains git hooks that should be installed in your local repository.

## Pre-commit Hook

The `pre-commit` hook runs automatically before each commit to ensure code quality.

### What it does:
1. **Backend Tests**: Runs pytest unit tests with coverage checking (95% threshold)
2. **Frontend Tests**: Runs Jest unit tests with coverage checking (98% threshold)

### Installation

To install the hook in your local repository:

```bash
# From the repository root
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Or use git's built-in hooks path configuration:

```bash
git config core.hooksPath .githooks
```

### Manual Installation (Already Done)

The pre-commit hook has already been installed in `.git/hooks/pre-commit` for this repository.

### What happens on commit:

```
Running unit tests before commit...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐍 Running backend tests...
[Backend test output]
✅ Backend tests passed!

⚛️  Running frontend tests...
[Frontend test output]
✅ Frontend tests passed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All tests passed!
```

### Skipping the hook

If you need to commit without running tests (not recommended):

```bash
git commit --no-verify -m "Your commit message"
```

### Requirements

- **Backend**: Python 3.13+, pytest installed (`pip install -r backend/requirements.txt`)
- **Frontend**: Node.js, npm dependencies installed (`cd frontend && npm install`)

### Coverage Thresholds

- **Backend**: 95% coverage required (statements, branches, functions, lines)
- **Frontend**: 98% coverage required (statements, branches, functions, lines)

### Troubleshooting

**Frontend tests skipped**: If you see "Frontend dependencies not installed", run:
```bash
cd frontend && npm install
```

**Hook not running**: Make sure the hook is executable:
```bash
chmod +x .git/hooks/pre-commit
```

**Tests failing**: Fix the tests before committing. The hook prevents commits with failing tests to maintain code quality.
