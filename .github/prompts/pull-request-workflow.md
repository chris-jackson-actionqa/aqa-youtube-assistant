# Pull Request Workflow Prompt

Use this prompt to guide the AI through the complete pull request process from branch push to merge and cleanup.

---

## Instructions

Please help me complete the pull request workflow for my current branch:

1. **Push the current branch** to the remote repository if not already pushed
   - Check current branch name
   - Push to origin

2. **Create a pull request** using the GitHub MCP server
   - Use the current branch as the head branch
   - Target branch: `main`
   - Generate an appropriate title based on the changes
   - Include a description summarizing the changes made

3. **Check PR status and workflow runs**
   - Use `gh pr view <PR_NUMBER>` to see PR details and status
   - Use `gh pr checks <PR_NUMBER>` to view all status checks
   - Use `gh run list --branch <BRANCH_NAME>` to see workflow runs
   - Use `gh run view <RUN_ID>` to see detailed workflow results
   - Wait for all checks to complete successfully

4. **Request Copilot code review** on the pull request
   - Wait for the review to complete
   - Show me the review comments

5. **Address review comments**
   - Help me understand and implement any requested changes
   - Make necessary code modifications
   - Commit and push the changes
   - Respond to review comments as appropriate
   - Re-check PR status after pushing changes

6. **Verify all checks passed before merging**
   - Run `gh pr checks <PR_NUMBER>` to confirm all checks are green
   - Verify workflow runs completed successfully
   - Confirm no failing tests or linting issues
   - Ensure code review is approved

7. **Merge the pull request** once all checks pass and comments are addressed
   - Confirm that all checks have passed
   - Merge using the appropriate merge strategy (squash, merge commit, or rebase)

8. **Wait for merge to complete**
   - Verify the PR was successfully merged to main

9. **Clean up local repository**
   - `git checkout main`
   - `git pull origin main`
   - Delete the feature branch locally and remotely

---

## GitHub CLI Commands Reference

### Check PR Status
```bash
# View PR details and overall status
gh pr view <PR_NUMBER>

# View all status checks (CI/CD, tests, etc.)
gh pr checks <PR_NUMBER>

# Watch checks in real-time (auto-updates)
gh pr checks <PR_NUMBER> --watch
```

### Check Workflow Runs
```bash
# List recent workflow runs for the branch
gh run list --branch <BRANCH_NAME>

# View detailed results of a specific run
gh run view <RUN_ID>

# Watch a workflow run in real-time
gh run watch <RUN_ID>

# View logs for a failed run
gh run view <RUN_ID> --log-failed
```

### Quick Status Check
```bash
# One-command status check for current branch
gh pr checks $(gh pr list --head $(git branch --show-current) --json number --jq '.[0].number')
```

---

## Quick Usage

Copy and paste this prompt when you're ready to create a PR:

```
I'm ready to create a pull request. Please follow the pull request workflow:
- Push my current branch
- Create a PR to main
- Check PR status and wait for all workflow checks to complete
- Verify all CI/CD checks pass (backend tests, frontend tests, E2E tests)
- Request and wait for Copilot code review
- Help me address any review comments
- Re-check all status checks after any changes
- Merge the PR only when all checks are green and approved
- Switch to main, pull latest changes, and clean up the feature branch
```

---

## Notes

- Ensure all local changes are committed before starting this workflow
- **CRITICAL**: Always check that all CI/CD workflows pass before merging
  - Backend tests must pass (95% coverage)
  - Frontend tests must pass (98% coverage)
  - E2E tests must pass
  - All linting and formatting checks must pass
- Use `gh pr checks --watch` to monitor checks in real-time
- The AI will pause at review comments to let you review and approve changes
- You can customize the merge strategy when merging
- Feature branch will be deleted both locally and remotely after successful merge
- If any check fails, investigate logs using `gh run view <RUN_ID> --log-failed`
