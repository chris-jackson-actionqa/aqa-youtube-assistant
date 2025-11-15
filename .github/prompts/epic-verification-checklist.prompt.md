# Epic Status Verification Checklist

**Purpose**: Ensure accurate epic status reporting by verifying actual GitHub issue states rather than trusting potentially stale epic body text.

**When to Use**: EVERY TIME you analyze an epic's status, progress, or completion.

---

## 🔍 The Five-Phase Verification Process

### Phase 1: Gather Raw Data ✅

**Objective**: Collect all necessary information from GitHub

- [ ] **Get ALL open issues** for the repository/epic
  ```
  Use: mcp_github_github_search_issues with state filter
  ```

- [ ] **Get ALL closed issues** (last 30-60 days minimum)
  ```
  Use: mcp_github_github_search_issues with state=closed
  Sort by updated or closed date
  ```

- [ ] **Read the epic's body text** to identify all sub-task issue numbers
  ```
  Look for patterns like:
  - "Issue #12 - Task name"
  - "- [ ] #12 - Task name"
  - "✅ #12 - Task name"
  ```

- [ ] **DO NOT trust epic body text status indicators**
  ```
  Ignore: ✅, 🚧, ❌, "IN PROGRESS", "COMPLETED", "PENDING"
  These may be outdated!
  ```

---

### Phase 2: Verify Each Sub-Task ✅

**Objective**: Determine the actual state of each sub-task from GitHub

For **EACH** issue number mentioned in the epic:

- [ ] **Check if issue # appears in OPEN issues list**
  - If found → Record as: `OPEN`
  - Note: Issue is actively being worked on or not yet started

- [ ] **Check if issue # appears in CLOSED issues list**
  - If found → Record as: `CLOSED`
  - Note the closed date and state_reason (completed/not_planned)

- [ ] **Record actual GitHub state** (not epic's claim)
  ```
  Example tracking:
  #3  → OPEN (despite epic saying "✅ COMPLETED")
  #12 → CLOSED on Oct 25 (despite epic saying "🚧 IN PROGRESS")
  #15 → CLOSED on Oct 26 (epic correctly shows "✅")
  ```

- [ ] **Note discrepancies** between epic text and reality
  ```
  Example:
  "Epic claims #12 is 'PENDING' but GitHub shows CLOSED since Oct 25"
  ```

---

### Phase 3: Calculate Truth ✅

**Objective**: Derive accurate metrics from verified GitHub data

- [ ] **Count CLOSED sub-tasks** from verified GitHub state
  ```
  Count all issues that appear in CLOSED issues list
  NOT from epic's checkboxes or status indicators
  ```

- [ ] **Count TOTAL sub-tasks** mentioned in epic
  ```
  All unique issue numbers referenced in epic body
  Include both open and closed
  ```

- [ ] **Calculate completion %** = (closed / total) × 100
  ```
  Example:
  8 closed issues out of 12 total = 67% complete
  NOT 60% as epic might claim
  ```

- [ ] **Identify OPEN sub-tasks** that need work
  ```
  List all issues that appear in OPEN issues list
  These are the actual remaining work items
  ```

- [ ] **Determine if epic can be closed**
  ```
  If ALL sub-tasks are CLOSED → Epic can be closed
  If ANY sub-task is OPEN → Epic must remain open
  ```

---

### Phase 4: Report Findings ✅

**Objective**: Communicate accurate status and discrepancies to the user

- [ ] **Report ACTUAL status** based on GitHub, not epic body
  ```
  Example:
  "Based on GitHub verification:
  - CLOSED: Issues #11, #12, #13, #15, #28, #49, #60 (7 issues)
  - OPEN: Issues #2, #3, #4, #5, #37, #38, #39 (7 issues)
  - COMPLETION: 50% (7 of 14 issues closed)"
  ```

- [ ] **List discrepancies** between epic body and reality
  ```
  Example:
  "⚠️ Discrepancies Found:
  - Epic shows #3 as '✅ COMPLETED' but issue is OPEN
  - Epic shows #12 as 'IN PROGRESS' but issue CLOSED Oct 25
  - Epic says 'Next Priority: #12' but #12 is already closed"
  ```

- [ ] **Recommend epic update** if status is stale
  ```
  "📝 Recommendation: Epic #2 body text is outdated and should be updated to reflect current reality"
  ```

- [ ] **Identify next work item** from OPEN sub-tasks
  ```
  Do NOT use epic's "Next Priority" section
  Instead: "Next recommended work: Issue #3 (first open sub-task)"
  ```

- [ ] **Propose closing epic** if all work complete
  ```
  If all sub-tasks closed: "🎉 All sub-tasks complete. Epic #2 can be closed."
  ```

---

### Phase 5: Update or Recommend Update ✅

**Objective**: Ensure epic reflects current reality

- [ ] **Offer to update epic body** with accurate status
  ```
  "Would you like me to update Epic #2 with the verified status?"
  ```

- [ ] **Update completion percentage** in epic
  ```
  Change: "60% Complete" → "50% Complete (7 of 14 closed)"
  Base on actual GitHub states
  ```

- [ ] **Update sub-task status indicators**
  ```
  For CLOSED issues: ✅
  For OPEN issues: 🚧 or ❌
  
  Example:
  - ✅ Issue #11 - Refactor (CLOSED Oct 22)
  - ✅ Issue #12 - ProjectList (CLOSED Oct 25)
  - 🚧 Issue #3 - Data model (OPEN)
  - 🚧 Issue #4 - API endpoints (OPEN)
  ```

- [ ] **Update "Next Priority" section** based on actual open issues
  ```
  Replace stale "Next Priority: #12"
  With accurate "Next Priority: #3 - Backend data model"
  ```

- [ ] **Close epic** if all sub-tasks are closed
  ```
  If verification shows 100% complete → Close the epic
  Add final comment with completion summary
  ```

---

## ⚠️ Critical Anti-Patterns - NEVER Do This

### ❌ Anti-Pattern 1: Trusting Epic Body Text

**Wrong Approach**:
```
1. Read epic body → See "Issue #12 - PENDING"
2. Trust the status → Report "Issue #12 is pending"
3. Result: Incorrect! Issue #12 was closed 5 days ago
```

**Why It's Wrong**:
- Epic body text is manually maintained and often outdated
- Status indicators (✅, 🚧) may not reflect current reality
- Leads to false progress reports and wrong prioritization

---

### ❌ Anti-Pattern 2: Using Epic's "Next Priority" Blindly

**Wrong Approach**:
```
1. Read epic → See "Next Priority: Issue #12"
2. Report to user → "Work on Issue #12 next"
3. Result: Issue #12 is already closed! Wasted effort
```

**Why It's Wrong**:
- "Next Priority" section may not be updated after issues close
- Leads to confusion and duplicate work
- User may attempt to work on already-completed tasks

---

### ❌ Anti-Pattern 3: Calculating Completion from Checkboxes

**Wrong Approach**:
```
1. Read epic → See 3 checked boxes, 2 unchecked
2. Calculate → "60% complete (3 of 5)"
3. Result: Actual completion is 80% (4 of 5 closed)
```

**Why It's Wrong**:
- Checkboxes are manually updated and unreliable
- GitHub issue state is the single source of truth
- Leads to inaccurate progress tracking

---

## ✅ Correct Pattern - Always Follow This

### Correct Verification Flow

```
Step 1: Gather Data
├─ Get all OPEN issues from GitHub API
├─ Get all CLOSED issues from GitHub API (30-60 days)
└─ Read epic body to extract issue numbers

Step 2: Cross-Reference
├─ For each issue # in epic:
│   ├─ Check if in OPEN list → Mark as OPEN
│   ├─ Check if in CLOSED list → Mark as CLOSED
│   └─ Compare with epic's claim → Note discrepancy
└─ Build verified status table

Step 3: Calculate Truth
├─ Count closed issues: 7
├─ Count total issues: 14
├─ Calculate: 7/14 = 50% complete
└─ List open issues: #3, #4, #5, #37, #38, #39

Step 4: Report Findings
├─ Report verified completion: 50%
├─ List discrepancies: Epic claims 60%, reality is 50%
├─ Recommend next work: Issue #3 (first open sub-task)
└─ Offer to update epic

Step 5: Take Action
└─ Update epic body OR recommend user update it
```

---

## 📊 Example Verification Report

**Format for reporting to users:**

```markdown
## Epic #2 Status Verification Report

### Verified Completion: 50% (7 of 14 issues closed)

**Closed Issues (Verified via GitHub):**
- ✅ #11 - Refactor Video→Project model (closed Oct 22, 2025)
- ✅ #12 - ProjectList component (closed Oct 25, 2025)
- ✅ #13 - ProjectDeleteConfirmation (closed Oct 26, 2025)
- ✅ #15 - Component integration (closed Oct 26, 2025)
- ✅ #28 - Frontend validation (closed Oct 25, 2025)
- ✅ #49 - E2E tests (closed Oct 26, 2025)
- ✅ #60 - Fix React warnings (closed Oct 28, 2025)

**Open Issues (Verified via GitHub):**
- 🚧 #2 - Epic itself (open)
- 🚧 #3 - Backend data model (open)
- 🚧 #4 - Backend API endpoints (open)
- 🚧 #5 - Frontend UI components (open)
- 🚧 #37 - Loading states (open)
- 🚧 #38 - Error handling (open)
- 🚧 #39 - Edge cases (open)

**⚠️ Discrepancies Found:**
1. Epic body claims "Backend: 100% Complete" but issues #3 and #4 are OPEN
2. Epic body shows "Issue #12 - IN PROGRESS" but #12 closed Oct 25
3. Epic says "Next Priority: #12" but #12 is already closed
4. Epic claims "60% complete" but actual completion is 50%

**📝 Recommendation:**
Epic #2 body text is significantly outdated. Should I update it with verified status?

**🎯 Actual Next Priority:**
Issue #3 - Backend data model (currently OPEN, foundational work)
```

---

## 🚀 Quick Reference Card

**Before Reporting Epic Status:**

1. ✅ Get OPEN issues list
2. ✅ Get CLOSED issues list  
3. ✅ Read epic body for issue numbers
4. ✅ Cross-reference each issue with GitHub state
5. ✅ Count closed vs total
6. ✅ Calculate actual completion %
7. ✅ List discrepancies
8. ✅ Report verified truth
9. ✅ Recommend next work from OPEN issues
10. ✅ Offer to update epic

**Never:**
- ❌ Trust epic body text status
- ❌ Use epic's completion %
- ❌ Use epic's "Next Priority"
- ❌ Count checkboxes
- ❌ Assume anything

**Always:**
- ✅ Verify with GitHub API
- ✅ Trust issue state only
- ✅ Report discrepancies
- ✅ Recommend updates
- ✅ Calculate from verified data

---

**Last Updated**: November 1, 2025
**Related**: `.github/prompts/project-planner.md`
