# E2E Test Case Inventory

## Overview

This document provides a comprehensive inventory of all E2E test cases for the YouTube Assistant application. Each test case includes ID, priority, description, steps, expected results, and implementation status.

---

## Test Case Categories

- **[PC]** - Project Creation
- **[PL]** - Project List
- **[PS]** - Project Selection
- **[PU]** - Project Update
- **[PD]** - Project Deletion
- **[EH]** - Error Handling
- **[SP]** - State Persistence
- **[UI]** - User Interface

---

## Legend

| Symbol | Meaning                          |
| ------ | -------------------------------- |
| ⭐     | Critical (must pass for release) |
| ⚠️     | High priority (should pass)      |
| 📋     | Medium priority (nice to have)   |
| ✅     | Implemented & Passing            |
| 🚧     | Partially Implemented            |
| ⏳     | Not Yet Implemented              |
| ❌     | Blocked/Deprecated               |

---

## Project Creation Tests

### PC-001: Create Project with Valid Data ⭐

**Priority**: Critical  
**Status**: ✅ Implemented  
**File**: `e2e/tests/example.spec.ts`

**Description**: User successfully creates a new project with name and description

**Preconditions**:

- User on homepage
- Database is empty

**Steps**:

1. Click "Create New Project" button
2. Fill in project name: "Test Project"
3. Fill in description: "Test Description"
4. Click "Create Project" button

**Expected Result**:

- Project created in database
- Project card appears in list
- Success message displayed
- Form closes/resets

**Test Data**:

- Name: "Test Project"
- Description: "Test Description"

---

### PC-002: Create Project with Name Only ⭐

**Priority**: Critical  
**Status**: ⏳ Not Implemented

**Description**: User creates project with only name (minimal valid data)

**Preconditions**:

- User on homepage

**Steps**:

1. Click "Create New Project" button
2. Fill in project name: "Minimal Project"
3. Leave description empty
4. Click "Create Project" button

**Expected Result**:

- Project created successfully
- Project appears in list with no description
- Success message shown

---

### PC-003: Validation - Empty Project Name ⭐

**Priority**: Critical  
**Status**: ✅ Implemented  
**File**: `e2e/tests/example.spec.ts`

**Description**: System prevents creating project with empty name

**Steps**:

1. Click "Create New Project" button
2. Leave project name empty
3. Attempt to click "Create Project" button

**Expected Result**:

- Submit button is disabled
- No project created
- Form remains open

---

### PC-004: Validation - Whitespace Only Name ⭐

**Priority**: Critical  
**Status**: ⏳ Not Implemented

**Description**: System rejects project name containing only whitespace

**Steps**:

1. Click "Create New Project" button
2. Fill name with spaces: " "
3. Attempt to submit

**Expected Result**:

- Validation error shown
- No project created

---

### PC-005: Duplicate Project Name ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: System prevents creating project with duplicate name

**Preconditions**:

- Project "Existing Project" already exists

**Steps**:

1. Click "Create New Project" button
2. Fill in name: "Existing Project"
3. Click "Create Project"

**Expected Result**:

- Error message: "Project with this name already exists"
- No duplicate created
- Form remains open for correction

---

### PC-006: Case-Insensitive Duplicate Detection ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: Duplicate detection works regardless of case

**Preconditions**:

- Project "Test Project" exists

**Steps**:

1. Try to create "test project" (lowercase)

**Expected Result**:

- Detected as duplicate
- Error shown

---

### PC-007: Very Long Project Name ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: System handles very long project names

**Steps**:

1. Create project with name of 255 characters

**Expected Result**:

- Project created (if within limit)
- Name displayed correctly (possibly truncated in UI)

---

### PC-008: Special Characters in Name ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: System handles special characters in project name

**Test Data**:

- Name: `Project #1: "TypeScript" & <React>`

**Expected Result**:

- Project created successfully
- Special characters preserved
- No XSS vulnerabilities

---

### PC-009: Cancel Project Creation 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: User cancels project creation without saving

**Steps**:

1. Click "Create New Project"
2. Fill in data
3. Click "Cancel"

**Expected Result**:

- Form closes
- No project created
- No error messages

---

### PC-010: Loading State During Creation 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: UI shows loading state during project creation

**Steps**:

1. Fill form and submit
2. Observe UI during API call

**Expected Result**:

- Loading spinner/indicator visible
- Submit button disabled
- Form inputs disabled

---

## Project List Tests

### PL-001: Display All Projects ⭐

**Priority**: Critical  
**Status**: ⏳ Not Implemented

**Description**: System displays all existing projects

**Preconditions**:

- 3 projects exist in database

**Steps**:

1. Navigate to homepage

**Expected Result**:

- All 3 projects displayed
- Each shows name, description, status
- Projects are in correct order

---

### PL-002: Empty State Display ⭐

**Priority**: Critical  
**Status**: ✅ Implemented  
**File**: `e2e/tests/example.spec.ts`

**Description**: System shows empty state when no projects exist

**Preconditions**:

- Database is empty

**Steps**:

1. Navigate to homepage

**Expected Result**:

- Empty state message shown
- "Create your first project" guidance
- "Create New Project" button visible
- "0 projects" count shown

---

### PL-003: Project Display Information ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: Each project card displays all required information

**Preconditions**:

- Project with all fields populated exists

**Expected Result**:

- Project name visible
- Description visible
- Status badge visible
- Created/updated dates visible
- Action buttons visible

---

### PL-004: Truncated Long Description ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: Long descriptions are truncated with ellipsis

**Preconditions**:

- Project with 500-character description exists

**Expected Result**:

- Description truncated at reasonable length
- Ellipsis (...) shown
- Option to expand (optional)

---

## Project Selection Tests

### PS-001: Select Project ⭐

**Priority**: Critical  
**Status**: ⏳ Not Implemented

**Description**: User selects a project to work on

**Steps**:

1. Click on project card

**Expected Result**:

- Project card shows selected state (visual indicator)
- Header shows "Working on: [Project Name]"
- Selection state saved

---

### PS-002: Clear Selection ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: User clears current project selection

**Preconditions**:

- Project is selected

**Steps**:

1. Click "Clear" button in header

**Expected Result**:

- Selection cleared
- "Working on:" header hidden
- No project has selected state

---

### PS-003: Switch Between Projects ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: User switches from one project to another

**Preconditions**:

- Multiple projects exist
- One is currently selected

**Steps**:

1. Click different project

**Expected Result**:

- Previous selection cleared
- New project selected
- Header updates to new project

---

### PS-004: Selection Persists on Reload ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: Project selection survives page reload

**Preconditions**:

- Project selected

**Steps**:

1. Reload page

**Expected Result**:

- Same project still selected
- Header shows correct project
- Visual indicator still present

---

## Project Deletion Tests

### PD-001: Delete Project with Confirmation ⭐

**Priority**: Critical  
**Status**: ⏳ Not Implemented

**Description**: User deletes project after confirming

**Steps**:

1. Click delete button on project card
2. Verify confirmation modal appears
3. Click "Delete Project" button

**Expected Result**:

- Confirmation modal shows project name
- After confirmation, project deleted
- Project removed from list
- Success message shown

---

### PD-002: Cancel Project Deletion ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: User cancels deletion

**Steps**:

1. Click delete button
2. Click "Cancel" in modal

**Expected Result**:

- Modal closes
- Project still exists
- No error messages

---

### PD-003: Delete Selected Project ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: Deleting currently selected project clears selection

**Preconditions**:

- Project is selected

**Steps**:

1. Delete the selected project

**Expected Result**:

- Project deleted
- Selection cleared
- Header updated

---

### PD-004: Delete Last Project 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: Deleting last project shows empty state

**Preconditions**:

- Only one project exists

**Steps**:

1. Delete the project

**Expected Result**:

- Empty state displayed
- Helpful message shown

---

## Error Handling Tests

### EH-001: API 500 Error ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: System handles server error gracefully

**Steps**:

1. Mock API to return 500
2. Attempt to create project

**Expected Result**:

- User-friendly error message
- No application crash
- Retry option available

---

### EH-002: Network Timeout ⚠️

**Priority**: High  
**Status**: ⏳ Not Implemented

**Description**: System handles network timeout

**Steps**:

1. Mock slow API (10+ seconds)
2. Attempt operation

**Expected Result**:

- Timeout message shown
- Ability to retry
- No hanging state

---

### EH-003: Backend Unavailable 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: Graceful behavior when backend is down

**Steps**:

1. Stop backend server
2. Attempt to load projects

**Expected Result**:

- Clear error message
- Suggestion to check connection
- No infinite loading

---

### EH-004: Delete Already-Deleted Project 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: Handle deleting project that no longer exists

**Steps**:

1. Delete project via API
2. Try to delete via UI

**Expected Result**:

- Appropriate error message
- Project removed from UI

---

## State Persistence Tests

### SP-001: Form Data Lost on Refresh 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: Form data not preserved on accidental refresh

**Steps**:

1. Fill project form
2. Refresh page without submitting

**Expected Result**:

- Form data lost (expected behavior)
- No unsaved data warning (can add in future)

---

### SP-002: Recently Created Project Appears 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: New project appears immediately in list

**Steps**:

1. Create project
2. Observe list

**Expected Result**:

- Project appears immediately
- No page reload needed
- List updates automatically

---

## User Interface Tests

### UI-001: Keyboard Navigation 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: User can navigate using keyboard

**Steps**:

1. Use Tab key to navigate
2. Use Enter to select
3. Use Escape to cancel

**Expected Result**:

- Tab order is logical
- Enter submits forms
- Escape closes modals

---

### UI-002: Dark Mode Support 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: UI works in dark mode

**Steps**:

1. Enable dark mode
2. Test all workflows

**Expected Result**:

- All elements visible
- Colors appropriate
- No contrast issues

---

### UI-003: Mobile Responsive 📋

**Priority**: Medium  
**Status**: ⏳ Not Implemented

**Description**: UI works on mobile devices

**Steps**:

1. Test on mobile viewport (375x667)
2. Test all interactions

**Expected Result**:

- Layout adjusts properly
- Touch targets adequate size
- No horizontal scroll

---

## API Integration Tests

### API-001: CRUD Operations ⚠️

**Priority**: High  
**Status**: ✅ Implemented  
**File**: `e2e/tests/example.spec.ts`

**Description**: All API operations work correctly

**Steps**:

1. Create via POST
2. Read via GET
3. Update via PUT
4. Delete via DELETE

**Expected Result**:

- All operations succeed
- Data persists correctly
- Proper HTTP status codes

---

### API-002: API Health Check ⚠️

**Priority**: High  
**Status**: ✅ Implemented  
**File**: `e2e/tests/example.spec.ts`

**Description**: Health endpoint responds correctly

**Expected Result**:

- Returns 200 OK
- Response time < 100ms

---

## Test Summary

### Implementation Status

| Category          | Total  | Implemented | In Progress | Not Started |
| ----------------- | ------ | ----------- | ----------- | ----------- |
| Project Creation  | 10     | 2           | 0           | 8           |
| Project List      | 4      | 1           | 0           | 3           |
| Project Selection | 4      | 0           | 0           | 4           |
| Project Deletion  | 4      | 0           | 0           | 4           |
| Error Handling    | 4      | 0           | 0           | 4           |
| State Persistence | 2      | 0           | 0           | 2           |
| User Interface    | 3      | 0           | 0           | 3           |
| API Integration   | 2      | 2           | 0           | 0           |
| **TOTAL**         | **33** | **5**       | **0**       | **28**      |

### Priority Breakdown

| Priority    | Count | Implemented | Remaining |
| ----------- | ----- | ----------- | --------- |
| ⭐ Critical | 10    | 4           | 6         |
| ⚠️ High     | 13    | 1           | 12        |
| 📋 Medium   | 10    | 0           | 10        |

---

## Test Execution Plan

### Phase 1: Critical Path (Issues #21, #22)

**Target**: Week 1  
**Tests**: PC-001, PC-003, PL-002, PD-001, API-001, API-002

### Phase 2: Validation & Edge Cases

**Target**: Week 2  
**Tests**: PC-002, PC-004, PC-005, PC-006, PL-001, PS-001, PS-004

### Phase 3: Error Handling

**Target**: Week 3  
**Tests**: EH-001, EH-002, PD-002, PD-003

### Phase 4: Polish & Enhancement

**Target**: Week 4  
**Tests**: Remaining medium priority tests

---

## Maintenance Notes

### Adding New Test Cases

1. Assign unique ID following pattern: `[CATEGORY]-[NUMBER]`
2. Set priority: ⭐ Critical, ⚠️ High, or 📋 Medium
3. Document preconditions clearly
4. Write explicit steps and expected results
5. Update summary tables

### Updating Test Status

- ✅ Implemented - Test written and passing
- 🚧 In Progress - Test partially complete
- ⏳ Not Started - Test not yet written
- ❌ Blocked - Cannot implement yet

---

**Last Updated**: October 25, 2025  
**Maintained By**: Project Team  
**Related**: Issue #20, Epic #18
