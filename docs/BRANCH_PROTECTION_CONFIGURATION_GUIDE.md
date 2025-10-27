# Branch Protection Configuration Guide

## Overview
This guide provides step-by-step instructions for repository administrators to configure branch protection rules for the `main` branch.

**⚠️ Administrator Access Required**: Only users with admin permissions on the repository can configure branch protection rules.

---

## Prerequisites

Before configuring branch protection:

1. ✅ All GitHub Actions workflows are functional:
   - `.github/workflows/e2e-tests.yml`
   - `.github/workflows/backend-tests.yml`
   - `.github/workflows/frontend-tests.yml`

2. ✅ Workflows have been executed at least once successfully

3. ✅ You have admin access to the repository

---

## Configuration Steps

### Method 1: GitHub Web UI (Recommended)

#### Step 1: Navigate to Branch Protection Settings

1. Go to the repository: https://github.com/chris-jackson-actionqa/aqa-youtube-assistant
2. Click **Settings** (top navigation)
3. Click **Branches** (left sidebar under "Code and automation")
4. Locate **Branch protection rules** section
5. Click **Add rule** (or **Edit** if a rule already exists for `main`)

#### Step 2: Configure Basic Settings

In the "Branch name pattern" field, enter: `main`

#### Step 3: Enable Required Settings

**Protect matching branches** - Check these boxes:

1. ☑️ **Require a pull request before merging**
   - This prevents direct commits to `main`
   - All changes must go through pull requests
   
   **Sub-options** (recommended):
   - Required number of approvals: `1` (optional, for team collaboration)
   - ☑️ Dismiss stale pull request approvals when new commits are pushed
   - ☐ Require review from Code Owners (leave unchecked unless you have CODEOWNERS file)
   - ☐ Require approval of the most recent reviewable push (optional)

2. ☑️ **Require status checks to pass before merging**
   - Ensures all automated tests pass before merge
   - This is the CRITICAL setting for quality gates
   
   **Sub-options**:
   - ☑️ **Require branches to be up to date before merging**
     - Forces branch to be rebased/merged with latest `main` before merge
     - Prevents merge conflicts and ensures tests run against latest code

#### Step 4: Add Required Status Checks

In the "Search for status checks" field, add these three status checks one at a time:

**Required Status Checks:**

1. **E2E Tests Status Check**
   - Type: `e2e-tests`
   - Full name: "Run Playwright E2E Tests"
   - Workflow: `.github/workflows/e2e-tests.yml`

2. **Backend Tests Status Check**
   - Type: `backend-tests`
   - Full name: "Run Backend Unit & Integration Tests"
   - Workflow: `.github/workflows/backend-tests.yml`

3. **Frontend Tests Status Check**
   - Type: `frontend-tests`
   - Full name: "Run Frontend Unit Tests (Jest)"
   - Workflow: `.github/workflows/frontend-tests.yml`

**Note**: Status checks will only appear in the search after they have been run at least once. If you don't see them:
1. Create a test pull request
2. Wait for workflows to run
3. Return to branch protection settings and add the checks

#### Step 5: Additional Recommended Settings

**Optional but Recommended:**

3. ☑️ **Require conversation resolution before merging**
   - All review comments must be marked as resolved
   - Ensures feedback is addressed

4. ☐ **Require signed commits** (optional)
   - Enhances security by requiring GPG-signed commits
   - Leave unchecked unless your team uses commit signing

5. ☐ **Require linear history** (optional)
   - Prevents merge commits, requires rebase
   - Leave unchecked for now (can add later)

6. ☐ **Require deployments to succeed before merging** (skip for now)
   - Only relevant if you have deployment environments configured

**Rules applied to everyone including administrators:**

7. ☐ **Allow force pushes** (LEAVE UNCHECKED)
   - ❌ Force pushes can rewrite history and break collaborators' work
   - Should NEVER be enabled for `main`

8. ☐ **Allow deletions** (LEAVE UNCHECKED)
   - ❌ Prevents accidental branch deletion
   - Keep disabled to protect `main` branch

#### Step 6: Save Configuration

1. Scroll to bottom of the page
2. Click **Create** (or **Save changes** if editing)
3. Confirm the rule is active (you should see it listed under "Branch protection rules")

---

### Method 2: GitHub CLI (Alternative)

For advanced users who prefer command-line tools:

```bash
# View current protection status
gh api repos/chris-jackson-actionqa/aqa-youtube-assistant/branches/main/protection

# Enable branch protection (basic)
gh api --method PUT repos/chris-jackson-actionqa/aqa-youtube-assistant/branches/main/protection \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=e2e-tests \
  --field required_status_checks[contexts][]=backend-tests \
  --field required_status_checks[contexts][]=frontend-tests \
  --field enforce_admins=false \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field restrictions=null
```

**Note**: The GitHub CLI method is more complex and requires careful JSON formatting. Use the web UI unless you have specific automation needs.

---

### Method 3: Rulesets (Modern Alternative)

GitHub now offers **Rulesets** as a more flexible alternative to traditional branch protection. To use rulesets:

#### Step 1: Navigate to Rulesets
1. Go to **Settings** → **Rules** → **Rulesets**
2. Click **New ruleset** → **New branch ruleset**

#### Step 2: Configure Ruleset
**Ruleset name**: `Main Branch Protection`  
**Enforcement status**: Active

**Target branches**: 
- Include by pattern: `main`

#### Step 3: Add Rules
1. **Restrict deletions**: Enable
2. **Require linear history**: Enable (optional)
3. **Require status checks to pass**:
   - Add: `e2e-tests`
   - Add: `backend-tests`
   - Add: `frontend-tests`
   - ☑️ Require branches to be up to date
4. **Block force pushes**: Enable
5. **Require pull request**:
   - Required approvals: 1
   - Dismiss stale approvals: Enable
6. **Require conversation resolution**: Enable

#### Step 4: Save Ruleset
Click **Create** to activate the ruleset.

---

## Verification Steps

After configuring branch protection, verify it works correctly:

### Test 1: Verify Direct Push is Blocked

```bash
# Try to push directly to main (should fail)
git checkout main
git commit --allow-empty -m "test: verify protection"
git push origin main
# Expected: Error message about protected branch
```

### Test 2: Create Test PR

1. Create a new branch:
   ```bash
   git checkout -b test/verify-branch-protection
   ```

2. Make a trivial change (add a comment to README)

3. Commit and push:
   ```bash
   git add README.md
   git commit -m "test: verify branch protection setup"
   git push -u origin test/verify-branch-protection
   ```

4. Create a pull request to `main`

5. Verify:
   - ✅ PR shows required status checks (E2E, Backend, Frontend)
   - ✅ "Merge" button is disabled until checks pass
   - ✅ Status checks run automatically

6. After checks pass:
   - ✅ "Merge" button becomes enabled
   - ✅ Can successfully merge PR

7. Clean up:
   ```bash
   git checkout main
   git pull origin main
   git branch -d test/verify-branch-protection
   git push origin --delete test/verify-branch-protection
   ```

### Test 3: Verify Out-of-Date Branch Block

1. Create two branches from `main`
2. Merge first branch to `main`
3. Try to merge second branch
4. Expected: GitHub prevents merge and shows "Update branch" button

---

## Common Configuration Issues

### Issue: Status Checks Not Appearing in Search

**Cause**: Workflows have not been executed yet.

**Solution**:
1. Create a test pull request
2. Wait for all workflows to complete
3. Return to branch protection settings
4. Status checks should now appear in search

### Issue: Workflows Run But Aren't Listed as Status Checks

**Cause**: Job names in workflows don't match expected status check names.

**Solution**: Verify workflow job names match:
- `.github/workflows/e2e-tests.yml` → job name: `e2e-tests`
- `.github/workflows/backend-tests.yml` → job name: `backend-tests`
- `.github/workflows/frontend-tests.yml` → job name: `frontend-tests`

### Issue: Can't Enable "Require branches to be up to date"

**Cause**: GitHub requires at least one status check to be selected first.

**Solution**: Add at least one status check, then the option will become available.

### Issue: Admins Can Still Merge Failing PRs

**Explanation**: By default, branch protection can be bypassed by administrators.

**If needed**: Enable "Do not allow bypassing the above settings" (use with caution - makes emergency fixes harder)

---

## Updating Configuration

### Adding New Status Checks

When adding new workflows:

1. Create and merge the new workflow file
2. Wait for workflow to run at least once
3. Go to branch protection settings
4. Search for the new status check name
5. Add it to required checks
6. Save changes

### Removing Status Checks

To remove a status check:

1. Go to branch protection settings
2. Find the status check in the list
3. Click the **×** next to it
4. Save changes

---

## Emergency Bypass Procedures

**⚠️ USE ONLY IN GENUINE EMERGENCIES**

If you must bypass branch protection:

### Option 1: Temporary Disable

1. Go to branch protection settings
2. Click **Edit** on the main branch rule
3. Uncheck "Require status checks to pass before merging"
4. Save changes
5. Merge the PR
6. **IMMEDIATELY** re-enable the setting

### Option 2: Admin Override

If you have admin permissions and "Include administrators" is unchecked:
1. You can merge despite failing checks
2. Document the reason in PR comments
3. Create immediate follow-up issue to fix

**After Emergency Bypass:**
- Document what happened and why
- Create follow-up issue to fix the problem
- Fix within 24 hours
- Never make bypassing a habit

---

## Rollback Plan

If branch protection causes issues:

### Temporary Disable
1. Go to Settings → Branches
2. Click **Delete** on the branch protection rule
3. Fix the underlying issue
4. Re-enable protection

### Partial Rollback
1. Edit the branch protection rule
2. Uncheck problematic settings
3. Keep other protections active
4. Incrementally re-enable settings as issues are resolved

---

## Monitoring and Maintenance

### Regular Checks
- Monthly: Review branch protection settings
- After workflow changes: Verify status checks still work
- After team changes: Update required reviewers if applicable

### GitHub Insights
View branch protection effectiveness:
1. Go to **Insights** → **Pulse**
2. Check "Merged pull requests" vs "Closed without merging"
3. High merge rate = protection is working well

---

## Related Documentation

- [Branch Protection Rules](../docs/BRANCH_PROTECTION.md) - User-facing documentation
- [Git & GitHub Workflow Checklist](../.github/workflows/GIT_GITHUB_WORKFLOW_CHECKLIST.md)
- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)

---

## Support

If you encounter issues configuring branch protection:

1. Check this guide's "Common Configuration Issues" section
2. Review GitHub's official documentation
3. Test with a dummy PR to verify settings
4. Document any recurring issues for future reference

---

**Last Updated**: October 27, 2025  
**Version**: 1.0.0  
**For**: Repository Administrators
