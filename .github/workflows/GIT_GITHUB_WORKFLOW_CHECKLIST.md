# Git and GitHub Workflow Checklist

**Purpose**: Standard Git and GitHub workflow for all development work on the YouTube Assistant project.

**Applies to**: All developers, AI agents, and contributors

---

## 🚀 Before Starting Work

### Prerequisites
- [ ] Read the related GitHub issue completely
- [ ] Understand acceptance criteria and requirements
- [ ] Verify you're on the latest `main` branch
- [ ] Identify if anything is unclear (ask questions first!)

### Branch Setup
```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Create feature branch from main
git checkout -b feature/descriptive-name
# OR for bug fixes
git checkout -b fix/bug-description

# 3. Verify you're on the new branch
git branch --show-current
```

**Branch Naming Conventions:**
- `feature/issue-XX-short-description` - New features
- `fix/issue-XX-bug-description` - Bug fixes
- `docs/what-documentation` - Documentation updates
- `test/what-tests` - Test additions/updates
- `refactor/what-refactoring` - Code refactoring

---

## 💻 During Development

### Work in Small Increments
- [ ] Make one logical change at a time
- [ ] Ensure code compiles/runs after each change
- [ ] Run tests frequently during development
- [ ] Commit after each working increment

### Check Status Frequently
```bash
# See what files have changed
git status

# See what changed in files
git diff

# See staged changes
git diff --cached
```

### Stage and Commit Changes
```bash
# Stage specific files (preferred)
git add path/to/file1.py path/to/file2.py

# OR stage all changes (use with caution)
git add .

# Commit with descriptive message
git commit -m "type: description"
```

**⚠️ CRITICAL: Pre-Commit Hooks**

Pre-commit hooks run automatically when you commit. They exist to catch issues before they reach the repository:

- **If pre-commit hooks fail**: The commit will be aborted
- **Your responsibility**: Fix the issues, don't bypass the hooks
- **NEVER use `--no-verify` or `--no-hooks`**: These flags bypass quality checks

**Common hook failures and solutions:**
```bash
# ❌ WRONG: Bypassing hooks
git commit --no-verify -m "message"

# ✅ CORRECT: Fix the issues
# 1. Read the error message
# 2. Fix the failing tests or linting issues
# 3. Stage the fixes
git add <fixed-files>
# 4. Commit normally (hooks will run again)
git commit -m "message"
```

**Commit Message Format:**
```
<type>: <short description>

[optional body]
[optional footer]
```

**Commit Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `test:` - Adding or updating tests
- `docs:` - Documentation changes
- `refactor:` - Code refactoring (no functionality change)
- `perf:` - Performance improvement
- `chore:` - Build process or auxiliary tool changes
- `style:` - Code style/formatting changes

**Examples:**
```bash
git commit -m "feat: add case-insensitive unique constraint to projects.name"
git commit -m "test: add unit tests for duplicate project validation"
git commit -m "fix: handle null description in project update"
git commit -m "docs: update API documentation for project endpoints"
```

---

## ✅ Pre-Commit Checklist

Before every commit, verify:

### Code Quality
- [ ] Code follows project style guide (PEP 8 for Python, ESLint for JavaScript)
- [ ] All functions have type hints (Python) or types (TypeScript)
- [ ] All public functions have docstrings/comments
- [ ] No commented-out code or debug statements
- [ ] No hardcoded values (use config/environment variables)
- [ ] No unused imports or variables
- [ ] **No test configuration changes** (coverage thresholds, test exclusions) without permission

### Testing
- [ ] All new code has unit tests
- [ ] All existing tests pass
- [ ] Coverage meets threshold (95% backend, 98% frontend)
- [ ] **Coverage thresholds NOT lowered** - Get permission if needed
- [ ] Integration tests added if needed
- [ ] Manual testing completed

### Functionality
- [ ] Feature works as expected
- [ ] Error handling implemented
- [ ] Edge cases considered and handled
- [ ] No breaking changes to existing functionality

### Documentation
- [ ] Code comments for complex logic
- [ ] API documentation updated (if applicable)
- [ ] README updated (if needed)
- [ ] Related issues referenced in commit message

---

## 📤 Pushing to Remote

### First Push
```bash
# Push branch and set upstream
git push -u origin feature/your-branch-name
```

### Subsequent Pushes
```bash
# Push new commits
git push
```

### Force Push (Use with Extreme Caution!)
```bash
# Only if you've rebased or amended commits
# NEVER force push to main!
git push --force-with-lease
```

---

## 🔄 Creating a Pull Request

### Before Creating PR
- [ ] All commits pushed to remote branch
- [ ] All tests passing (check CI/CD if applicable)
- [ ] Branch is up to date with `main` (rebase if needed)
- [ ] Code is ready for review

### PR Creation Checklist
- [ ] Descriptive PR title (follows commit convention)
- [ ] PR description includes:
  - [ ] What: Summary of changes
  - [ ] Why: Reason for changes
  - [ ] How: Approach taken
  - [ ] Related issue(s): `Fixes #XX` or `Related to #XX`
  - [ ] Testing: How it was tested
  - [ ] Screenshots (if UI changes)
- [ ] Appropriate labels applied
- [ ] Reviewers assigned
- [ ] Linked to relevant issue(s)

### PR Template Example
```markdown
## Description
Brief description of what this PR does.

## Related Issue
Fixes #30

## Changes Made
- Added case-insensitive UNIQUE constraint to projects.name
- Updated error messages to match requirements
- Added database constraint enforcement tests

## Testing
- All 57 tests pass (40 unit + 17 integration)
- Coverage: 96% (exceeds 95% threshold)
- Manually tested: [describe manual testing]

## Checklist
- [x] Tests added/updated
- [x] Documentation updated
- [x] No breaking changes
- [x] Follows code style guidelines
```

---

## 🔍 During Code Review

### As PR Author
- [ ] Respond to all review comments
- [ ] Make requested changes in new commits (don't force push)
- [ ] Re-request review after changes
- [ ] Resolve conversations when addressed

### Making Review Changes
```bash
# Make the requested changes
# Stage and commit as normal
git add path/to/changed/file.py
git commit -m "fix: address review feedback - improve error handling"

# Push changes
git push
```

---

## 🎯 Merging to Main

### Pre-Merge Checklist
- [ ] All review comments addressed
- [ ] All reviewers approved
- [ ] All CI/CD checks passing
- [ ] Branch is up to date with `main`
- [ ] No merge conflicts

### Merge Strategy
The project uses **Squash and Merge** by default:
- All commits in PR are squashed into one
- Clean, linear history on `main`
- Final commit message should be descriptive

### After Merge
```bash
# 1. Switch to main
git checkout main

# 2. Pull latest (includes your merged changes)
git pull origin main

# 3. Delete local feature branch
git branch -d feature/your-branch-name

# 4. Delete remote branch (if not auto-deleted)
git push origin --delete feature/your-branch-name
```

---

## 🔄 Keeping Branch Up to Date

### Rebase on Main (Preferred)
```bash
# 1. Fetch latest from remote
git fetch origin

# 2. Rebase your branch on main
git rebase origin/main

# 3. If conflicts, resolve them:
# - Fix conflicts in files
# - Stage resolved files: git add <file>
# - Continue rebase: git rebase --continue

# 4. Force push (since history changed)
git push --force-with-lease
```

### Merge Main into Branch (Alternative)
```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Switch back to feature branch
git checkout feature/your-branch-name

# 3. Merge main into your branch
git merge main

# 4. If conflicts, resolve them:
# - Fix conflicts in files
# - Stage resolved files: git add <file>
# - Commit merge: git commit

# 5. Push
git push
```

---

## 🆘 Common Scenarios

### Scenario: Made Changes on Wrong Branch
```bash
# If uncommitted:
git stash
git checkout correct-branch
git stash pop

# If committed:
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1  # Remove last commit
```

### Scenario: Need to Undo Last Commit (Not Pushed)
```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes and commit
git reset --hard HEAD~1
```

### Scenario: Made Commits on Main by Mistake
```bash
# 1. Create branch with current changes
git checkout -b feature/correct-branch

# 2. Switch back to main
git checkout main

# 3. Reset main to remote state
git reset --hard origin/main

# 4. Switch back to feature branch
git checkout feature/correct-branch
```

### Scenario: Merge Conflicts
```bash
# 1. Conflicts occur during merge/rebase
# 2. Git will mark conflicted files

# 3. Open conflicted files and look for conflict markers:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> branch-name

# 4. Edit to keep desired code
# 5. Remove conflict markers
# 6. Stage resolved files
git add <file>

# 7. Complete merge/rebase
git commit  # for merge
git rebase --continue  # for rebase
```

---

## 📋 Quick Reference

### Essential Commands
```bash
# Status and Info
git status                          # Show working tree status
git log --oneline -10              # Show last 10 commits
git branch                          # List local branches
git branch -r                       # List remote branches

# Branch Operations
git checkout -b feature/name        # Create and switch to branch
git checkout branch-name            # Switch to existing branch
git branch -d branch-name           # Delete local branch

# Stage and Commit
git add <file>                      # Stage specific file
git commit -m "message"             # Commit with message
git commit --amend                  # Amend last commit

# Sync with Remote
git fetch origin                    # Fetch remote changes
git pull origin main                # Pull from remote main
git push                            # Push commits
git push -u origin branch           # Push and set upstream

# Undo Operations
git restore <file>                  # Discard working changes
git reset --soft HEAD~1             # Undo last commit, keep changes
git reset --hard HEAD~1             # Undo last commit, discard changes

# Stash Operations
git stash                           # Stash current changes
git stash pop                       # Apply and remove stash
git stash list                      # List all stashes
```

---

## 🎓 Best Practices

### Do's ✅
- ✅ Create feature branch for every task
- ✅ Commit frequently with clear messages
- ✅ Test before committing
- ✅ Keep commits small and focused
- ✅ Pull latest main before starting work
- ✅ Rebase to keep history clean
- ✅ Write descriptive PR descriptions
- ✅ Respond to review feedback promptly
- ✅ Fix issues when pre-commit hooks fail

### Don'ts ❌
- ❌ Never commit directly to `main`
- ❌ Never force push to `main` or shared branches
- ❌ Never commit broken code
- ❌ Never commit without testing
- ❌ **Never use `--no-verify` or `--no-hooks` to bypass pre-commit checks**
- ❌ **Never lower coverage thresholds without explicit permission**
- ❌ Never push sensitive data (keys, passwords)
- ❌ Never commit commented-out code
- ❌ Never use `git add .` without reviewing changes
- ❌ Never ignore merge conflicts

---

## 🔗 Related Resources

- [GitHub Issue Management](../PROJECT_MANAGEMENT.md)
- [Backend Developer Agent](.github/prompts/backend-developer-agent.md)
- [Testing Standards](../backend/docs/TESTING_SUMMARY.md)
- [Project Style Guide](../README.md)

---

**Last Updated**: October 25, 2025  
**Maintained By**: Project Team
