# GitHub Project Board Manager Prompt

## Purpose
This prompt guides you through adding issues to the GitHub Projects board and organizing them properly with status and priority fields.

## Prerequisites
- GitHub CLI (`gh`) must be installed and authenticated with project permissions
- Run `gh auth refresh -s read:project -s project` if you get permission errors
- Issues must already exist in the repository

## Project Information
- **Repository**: chris-jackson-actionqa/aqa-youtube-assistant
- **Project Number**: 2
- **Project Name**: aqa-youtube-assistant kanban board
- **Project ID**: PVT_kwHOAHVEa84BGOIf

## Field Configuration

### Status Field
- **Field ID**: PVTSSF_lAHOAHVEa84BGOIfzg3VJNU
- **Options**:
  - Backlog: `f75ad846`
  - Ready: `61e4505c`
  - In progress: `47fc9ee4`
  - In review: `df73e18b`
  - Done: `98236657`

### Priority Field
- **Field ID**: PVTSSF_lAHOAHVEa84BGOIfzg3VJaQ
- **Options**:
  - P0 (Critical): `79628723`
  - P1 (High): `0a877460`
  - P2 (Medium): `da944a9c`

## Workflow

### Step 1: Add Issues to Project
For each issue you want to add to the board:

```bash
gh project item-add 2 --owner chris-jackson-actionqa --url https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/<ISSUE_NUMBER>
```

### Step 2: Get Item IDs
After adding issues, retrieve their project item IDs:

```bash
gh project item-list 2 --owner chris-jackson-actionqa --format json | jq -r '.items[] | "\(.id) | #\(.content.number) | \(.content.title)"'
```

This will output something like:
```
PVTI_lAHOAHVEa84BGOIfzggoOjM | #123 | Epic: Simple Desktop Deployment
```

### Step 3: Set Status and Priority
For each issue, set its status and priority using the item ID from Step 2:

**Set Status:**
```bash
gh project item-edit \
  --project-id PVT_kwHOAHVEa84BGOIf \
  --id <ITEM_ID> \
  --field-id PVTSSF_lAHOAHVEa84BGOIfzg3VJNU \
  --single-select-option-id <STATUS_OPTION_ID>
```

**Set Priority:**
```bash
gh project item-edit \
  --project-id PVT_kwHOAHVEa84BGOIf \
  --id <ITEM_ID> \
  --field-id PVTSSF_lAHOAHVEa84BGOIfzg3VJaQ \
  --single-select-option-id <PRIORITY_OPTION_ID>
```

## Status Selection Guide

Choose the appropriate status based on the issue's readiness:

- **Backlog**: Issue is planned but has blocking dependencies or not yet ready to start
- **Ready**: Issue has no blocking dependencies and can be started immediately
- **In progress**: Someone is actively working on the issue
- **In review**: PR is submitted and awaiting review
- **Done**: Issue is closed and complete

## Priority Selection Guide

- **P0 (Critical)**: Blocking bugs, security issues, production down
- **P1 (High)**: Important features, significant improvements, planned work for current sprint
- **P2 (Medium)**: Nice-to-have features, minor improvements, future work

## Best Practices

1. **Epic Organization**: Set epics to "Backlog" status, let sub-issues move through the workflow
2. **Dependencies**: Only set issues to "Ready" if all dependencies are resolved
3. **Priority Consistency**: All issues in the same epic should generally have the same priority
4. **Batch Operations**: Add all issues first, then set statuses/priorities in a second pass
5. **Verify**: Run `gh project item-list 2 --owner chris-jackson-actionqa` to confirm changes

## Quick Reference Commands

**List all items on board:**
```bash
gh project item-list 2 --owner chris-jackson-actionqa
```

**Remove item from board:**
```bash
gh project item-delete --project-id PVT_kwHOAHVEa84BGOIf --id <ITEM_ID>
```

**View project in browser:**
```bash
gh project view 2 --owner chris-jackson-actionqa --web
```

## Example: Adding a Single Issue

```bash
# 1. Add issue #150 to the board
gh project item-add 2 --owner chris-jackson-actionqa --url https://github.com/chris-jackson-actionqa/aqa-youtube-assistant/issues/150

# 2. Get the item ID (look for #150 in the output)
gh project item-list 2 --owner chris-jackson-actionqa --format json | jq -r '.items[] | select(.content.number == 150) | .id'

# 3. Set status to "Ready" (assuming it has no dependencies)
gh project item-edit \
  --project-id PVT_kwHOAHVEa84BGOIf \
  --id <ITEM_ID_FROM_STEP_2> \
  --field-id PVTSSF_lAHOAHVEa84BGOIfzg3VJNU \
  --single-select-option-id 61e4505c

# 4. Set priority to P1
gh project item-edit \
  --project-id PVT_kwHOAHVEa84BGOIf \
  --id <ITEM_ID_FROM_STEP_2> \
  --field-id PVTSSF_lAHOAHVEa84BGOIfzg3VJaQ \
  --single-select-option-id 0a877460
```

## Troubleshooting

**Error: "missing required scopes [read:project]"**
- Run: `gh auth refresh -s read:project -s project`
- Follow the authentication flow in your browser

**Error: "could not resolve to a ProjectV2"**
- Verify project number with: `gh project list --owner chris-jackson-actionqa`

**Error: "field not found"**
- Field IDs may have changed. Re-run: `gh project field-list 2 --owner chris-jackson-actionqa`

## Integration with Project Planner

After using the `project-planner.md` prompt to create issues:
1. Note all created issue numbers
2. Use this prompt to add them to the project board
3. Set statuses based on dependency analysis
4. Set priorities based on the epic's importance

## Automation Note

This workflow can be automated with a shell script if needed. See `scripts/` directory for any automation scripts that may have been created.
