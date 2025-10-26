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

3. **Request Copilot code review** on the pull request
   - Wait for the review to complete
   - Show me the review comments

4. **Address review comments**
   - Help me understand and implement any requested changes
   - Make necessary code modifications
   - Commit and push the changes
   - Respond to review comments as appropriate

5. **Merge the pull request** once all comments are addressed
   - Confirm that all checks have passed
   - Merge using the appropriate merge strategy (squash, merge commit, or rebase)

6. **Wait for merge to complete**
   - Verify the PR was successfully merged to main

7. **Clean up local repository**
   - `git checkout main`
   - `git pull origin main`
   - Delete the feature branch locally and remotely

---

## Quick Usage

Copy and paste this prompt when you're ready to create a PR:

```
I'm ready to create a pull request. Please follow the pull request workflow:
- Push my current branch
- Create a PR to main
- Request and wait for Copilot code review
- Help me address any review comments
- Merge the PR when approved
- Switch to main, pull latest changes, and clean up the feature branch
```

---

## Notes

- Ensure all local changes are committed before starting this workflow
- The AI will pause at review comments to let you review and approve changes
- You can customize the merge strategy when merging
- Feature branch will be deleted both locally and remotely after successful merge
