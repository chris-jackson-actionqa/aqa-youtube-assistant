# Pull Request Workflow Prompt

Use this prompt to guide the AI through the complete pull request process from branch push to merge and cleanup.

---

## Instructions

Please help me complete the pull request workflow for my current branch:

1. **Push the current branch** to the remote repository if not already pushed
   - Check current branch name with `git branch --show-current`
   - Push to origin with `git push -u origin <branch-name>`

2. **Create a pull request** using the GitHub MCP server
   - Use `mcp_github_github_create_pull_request` tool
   - Set head branch to current branch
   - Set base branch to `main`
   - Generate an appropriate title based on the changes
   - Include a comprehensive description summarizing the changes made

3. **Check workflow status using GitHub CLI** (MCP server doesn't support workflow checks)
   - Use `gh pr checks <PR_NUMBER>` to view all status checks
   - Use `gh pr checks <PR_NUMBER> --watch` to monitor in real-time
   - Wait for all checks to complete successfully
   - If any fail, use `gh run view <RUN_ID> --log-failed` to debug
   - **NEVER bypass failing checks** - Fix the issues instead

4. **Request Copilot code review** using the GitHub MCP server
   - Use `mcp_github_github_request_copilot_review` tool
   - Wait for the review to complete
   - Show review comments

5. **Address ALL review comments** (REQUIRED)
   - **CRITICAL**: Review comments MUST be addressed before resolving
   - For each comment:
     1. Read and understand the requested change
     2. Implement the code modification
     3. Verify the change is correct
     4. Test that the changes work
   - Make necessary code modifications
   - Commit and push the changes with `git commit` and `git push`
   - Respond to review comments using GitHub MCP server tools to explain changes
   - **NEVER resolve a comment without implementing the requested change**
   - Re-check workflow status with `gh pr checks <PR_NUMBER>`

6. **Resolve PR review threads using GitHub CLI with GraphQL**
   - First, get all review thread IDs for the pull request:
     ```bash
     gh api graphql -f query='query { 
       repository(owner: "OWNER", name: "REPO") { 
         pullRequest(number: PR_NUMBER) { 
           reviewThreads(first: 20) { 
             nodes { 
               id 
               isResolved 
               comments(first: 1) { 
                 nodes { body } 
               } 
             } 
           } 
         } 
       } 
     }'
     ```
   - Then resolve each thread using its ID (only AFTER implementing the requested changes):
     ```bash
     gh api graphql -f query='mutation { 
       resolveReviewThread(input: {threadId: "THREAD_ID"}) { 
         thread { isResolved } 
       } 
     }'
     ```
   - You can resolve multiple threads in one command using aliases:
     ```bash
     gh api graphql -f query='mutation { 
       t1: resolveReviewThread(input: {threadId: "THREAD_ID_1"}) { thread { isResolved } }
       t2: resolveReviewThread(input: {threadId: "THREAD_ID_2"}) { thread { isResolved } }
       t3: resolveReviewThread(input: {threadId: "THREAD_ID_3"}) { thread { isResolved } }
     }'
     ```
   - Verify all threads are resolved:
     ```bash
     gh api graphql -f query='query { 
       repository(owner: "OWNER", name: "REPO") { 
         pullRequest(number: PR_NUMBER) { 
           reviewThreads(first: 20) { 
             nodes { isResolved } 
           } 
         } 
       } 
     }' | jq '.data.repository.pullRequest.reviewThreads.nodes | map(.isResolved) | all'
     ```

7. **Verify all checks passed before merging** (use GitHub CLI)
   - Run `gh pr checks <PR_NUMBER>` to confirm all checks are green ✓
   - Verify workflow runs completed successfully:
     - ✓ Backend tests (95% coverage)
     - ✓ Frontend tests (98% coverage)
     - ✓ E2E tests
   - Confirm code review is approved
   - Ensure no failing tests or linting issues
   - **CRITICAL**: All checks MUST pass - never merge with failing checks
   - **NEVER lower coverage thresholds to make checks pass**

8. **Merge the pull request** using the GitHub MCP server
   - Use `mcp_github_github_merge_pull_request` tool
   - Confirm that all checks have passed
   - Choose merge strategy (squash, merge commit, or rebase)

9. **Wait for merge to complete**
   - Verify the PR was successfully merged to main

10. **Clean up local repository** using Git commands
   - `git checkout main`
   - `git pull origin main`
   - Delete local branch: `git branch -d <branch-name>`
   - Delete remote branch: `git push origin --delete <branch-name>`

---

## GitHub CLI Commands for Workflow Checks

**Note**: The GitHub MCP server doesn't provide workflow/action status checking, so use GitHub CLI for this:

### Check PR Workflow Status
```bash
# View all status checks (CI/CD, tests, etc.)
gh pr checks <PR_NUMBER>

# Watch checks in real-time (auto-updates)
gh pr checks <PR_NUMBER> --watch
```

### Debug Failed Workflows
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

## GitHub MCP Server Tools Used

This workflow uses the following GitHub MCP server tools:
- `mcp_github_github_create_pull_request` - Create PR
- `mcp_github_github_request_copilot_review` - Request Copilot review  
- `mcp_github_github_merge_pull_request` - Merge PR
- `mcp_github_github_add_issue_comment` - Respond to review comments (if needed)
- `mcp_github_github_update_pull_request` - Update PR details (if needed)

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
- Help me address any review comments by implementing the requested changes
- Resolve all PR review threads using GitHub CLI with GraphQL
- Re-check all status checks after any changes
- Merge the PR only when all checks are green and all threads are resolved
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
- **NEVER use `--no-verify` to bypass pre-commit hooks**
- **NEVER lower coverage thresholds to make tests pass**
- **NEVER exclude files from coverage without explicit permission**
- **If struggling with coverage**: Ask for help, don't lower standards
- **CRITICAL**: Always address review comments BEFORE resolving them
  - Implement the requested code changes
  - Test that the changes work
  - Commit and push the changes
  - Only then resolve the comment thread
  - Never resolve a comment without making the requested change
- Use `gh pr checks --watch` to monitor checks in real-time
- The AI will pause at review comments to let you review and approve changes
- You can customize the merge strategy when merging
- Feature branch will be deleted both locally and remotely after successful merge
- If any check fails, investigate logs using `gh run view <RUN_ID> --log-failed`
