# Chroma DB Integration Guide for Project Planning

This guide explains how the Project Planner uses Chroma DB MCP Server to maintain persistent context across planning sessions.

---

## Why Chroma DB for Planning?

**Problem**: Planning context gets lost between Copilot sessions
- Previous decisions aren't remembered
- Sprint retrospectives disappear
- Technical debt tracking is manual
- Design rationale is forgotten

**Solution**: Store planning knowledge in Chroma DB
- ✅ Persistent context across sessions
- ✅ Query past decisions and learnings
- ✅ Track project evolution over time
- ✅ Build institutional knowledge

---

## Collection Structure

### 1. `planning_decisions`
**Purpose**: Store major architectural and project decisions

**When to Store**:
- Choosing technologies or frameworks
- Deciding on architecture patterns
- Selecting approaches for features
- Trade-off decisions

**Example Document**:
```json
{
  "id": "decision-2025-10-21-state-management",
  "date": "2025-10-21",
  "context": "Epic #2 - Project Management",
  "decision": "Use React Context for state management",
  "rationale": "Simpler for MVP, team familiar with it, easy to upgrade to Redux/Zustand later if needed",
  "alternatives_considered": [
    "Redux - too complex for current needs",
    "Zustand - team unfamiliar",
    "Jotai - similar to Context but less standard"
  ],
  "impact": "Faster development, may need refactor if app grows complex",
  "team_consensus": true,
  "related_issues": [14]
}
```

**Query Examples**:
- "What state management approach was decided for the frontend?"
- "Why did we choose React Context over Redux?"
- "What alternatives were considered for state management?"

---

### 2. `issue_context`
**Purpose**: Detailed context about complex issues

**When to Store**:
- Creating issues with nuanced requirements
- Documenting risks and considerations
- Tracking implementation approaches
- Recording blockers and solutions

**Example Document**:
```json
{
  "id": "issue-11-video-to-project-refactor",
  "issue_number": 11,
  "title": "Refactor Video model to Project",
  "complexity": "medium",
  "estimated_hours": "1-2",
  "actual_hours": null,
  "risks": [
    "Breaking change to API",
    "Data loss if not careful with DB",
    "All tests need updating"
  ],
  "approach": "Drop and recreate DB for dev, create Alembic migration for future prod",
  "key_files": ["models.py", "schemas.py", "main.py", "all test files"],
  "breaking_change": true,
  "migration_notes": "Since in early dev, acceptable to drop/recreate. For prod, need Alembic.",
  "blockers": [],
  "related_issues": [3, 4]
}
```

**Query Examples**:
- "What's the complexity of Issue #11?"
- "What risks are associated with the model refactor?"
- "What files need to be updated for Issue #11?"

---

### 3. `sprint_retrospectives`
**Purpose**: Track sprint progress and learnings

**When to Store**:
- Beginning of sprint (planning)
- During sprint (updates)
- End of sprint (retrospective)

**Example Document**:
```json
{
  "id": "sprint-2025-10-21",
  "sprint_number": 1,
  "sprint_start": "2025-10-21",
  "sprint_end": "2025-11-04",
  "sprint_goal": "Complete Project Management MVP (Epic #2)",
  "planned_issues": [11, 12, 13, 14, 15],
  "planned_hours": 23,
  "team_capacity_hours": 40,
  "completed_issues": [],
  "in_progress_issues": [],
  "blocked_issues": [],
  "velocity": null,
  "learnings": [
    "Model refactor was straightforward due to good test coverage",
    "Component testing took longer than estimated - improve estimates"
  ],
  "what_went_well": [],
  "what_to_improve": [],
  "carry_over_to_next_sprint": []
}
```

**Query Examples**:
- "What was the goal of the last sprint?"
- "What issues were completed in Sprint 1?"
- "What learnings came from the previous sprint?"
- "What was our velocity last sprint?"

---

### 4. `technical_debt`
**Purpose**: Track known issues and refactoring needs

**When to Store**:
- Discovering code that needs refactoring
- Identifying architectural issues
- Noting "TODO" items from code reviews
- Recording quick fixes that need proper solutions

**Example Document**:
```json
{
  "id": "debt-model-naming-inconsistency",
  "date_identified": "2025-10-19",
  "area": "backend-models",
  "issue": "Model is named 'Video' but should be 'Project' per ADR-001",
  "impact": "medium",
  "priority": "high",
  "reason_exists": "Initial implementation before architecture decision",
  "effort_to_fix": "1-2 hours",
  "blocking_issues": [],
  "github_issue": 11,
  "status": "planned",
  "related_files": ["backend/app/models.py", "backend/app/main.py"]
}
```

**Query Examples**:
- "What technical debt exists in the backend?"
- "What are the high-priority refactoring items?"
- "Why does the model naming inconsistency exist?"

---

### 5. `feature_roadmap`
**Purpose**: Future feature ideas and requirements

**When to Store**:
- Brainstorming sessions
- User feedback
- Ideas that aren't ready for implementation
- Long-term vision items

**Example Document**:
```json
{
  "id": "feature-project-templates",
  "feature_name": "Project Templates",
  "description": "Pre-defined templates for common video types (tutorial, review, vlog, etc.)",
  "user_value": "Faster project setup, consistency across videos, best practices built-in",
  "priority": "medium",
  "estimated_effort": "1-2 weeks",
  "dependencies": ["Project Management MVP must be complete"],
  "status": "ideas",
  "user_stories": [
    "As a creator, I want to select a template when creating a project",
    "As a creator, I want to customize default fields in a template"
  ],
  "technical_notes": "Store templates in DB, allow customization, version control"
}
```

**Query Examples**:
- "What features are planned for the future?"
- "What's the priority of project templates?"
- "What user value does the templates feature provide?"

---

## Workflow Integration

### Planning Session Workflow

**1. Start of Session - Retrieve Context**
```
Query Chroma DB:
- "What was the status of Epic #2?"
- "What issues are currently blocked?"
- "What decisions were made in the last planning session?"
- "What technical debt needs addressing?"
```

**2. During Planning - Store Decisions**
```
Store in planning_decisions:
- Architecture choices
- Technology selections
- Trade-off decisions
- Design patterns

Store in issue_context:
- New issue details
- Complexity assessments
- Risk analysis
- Implementation approaches
```

**3. End of Session - Document Results**
```
Update sprint_retrospectives:
- Issues created
- Estimates provided
- Sprint plan
- Next actions
```

---

## Query Best Practices

### Effective Queries

✅ **Good**: "What state management decisions were made for the frontend?"
- Specific domain (frontend)
- Clear topic (state management)
- Type of info (decisions)

✅ **Good**: "What blockers were reported in the last sprint?"
- Timeframe (last sprint)
- Specific data (blockers)

❌ **Bad**: "Tell me everything"
- Too broad
- No focus

❌ **Bad**: "What's the status?"
- Unclear what status
- Missing context

### Query Templates

**Decision Retrieval**:
- "What was decided about [topic]?"
- "Why did we choose [approach] over [alternative]?"
- "What alternatives were considered for [feature]?"

**Status Checks**:
- "What's the completion status of [Epic/Issue]?"
- "What blockers exist for [issue]?"
- "What's the current sprint goal?"

**Historical Lookup**:
- "What learnings came from [sprint]?"
- "What was the velocity of [sprint]?"
- "What technical debt was identified in [area]?"

**Planning Queries**:
- "What features are in the roadmap?"
- "What's the priority of [feature]?"
- "What dependencies exist for [issue]?"

---

## Example Usage Scenarios

### Scenario 1: Starting a New Feature

**User**: "We need to add video script management"

**Agent Actions**:
1. Query: "Is there existing context about script management?"
2. Query: "What's the current architecture of the project?"
3. Query: "What decisions were made about data modeling?"
4. Create Epic with informed approach
5. Store decision rationale in Chroma DB
6. Break down into issues with context

### Scenario 2: Sprint Retrospective

**User**: "How did the last sprint go?"

**Agent Actions**:
1. Query: "What was the sprint goal?"
2. Query: "What issues were planned vs completed?"
3. Retrieve velocity and learnings
4. Update retrospective document
5. Store what went well / what to improve
6. Provide summary and recommendations

### Scenario 3: Technical Debt Review

**User**: "What technical debt do we have?"

**Agent Actions**:
1. Query: "What technical debt items exist?"
2. Group by area and priority
3. Check if any have GitHub issues
4. Recommend which to address in next sprint
5. Update debt status
6. Provide prioritized list

### Scenario 4: Architecture Decision

**User**: "Should we use GraphQL or REST for the new API?"

**Agent Actions**:
1. Query: "What API decisions have been made previously?"
2. Query: "What's the team's experience level?"
3. Evaluate options with context
4. Make recommendation
5. Store decision with rationale
6. Link to related issues

---

## Maintenance

### Regular Cleanup

**Weekly**:
- Update sprint retrospectives with progress
- Mark completed issues in issue_context
- Update technical debt status

**Monthly**:
- Archive old sprint data
- Review and update roadmap
- Consolidate related decisions

**Quarterly**:
- Evaluate collection structure
- Clean up outdated entries
- Export key learnings to documentation

---

## Integration with GitHub Issues

### Cross-Reference Strategy

**In GitHub Issues**:
```markdown
## Context
See Chroma DB: `planning_decisions` for architecture rationale
Related decision ID: `decision-2025-10-21-state-management`
```

**In Chroma DB**:
```json
{
  "github_issue": 14,
  "github_epic": 2,
  "github_labels": ["feature", "frontend", "state-management"]
}
```

This creates bidirectional links between persistent context and active work.

---

## Benefits Over Time

As the Chroma DB grows:
- ✅ Faster decision-making (precedent lookup)
- ✅ Better estimates (historical data)
- ✅ Consistent architecture (decision patterns)
- ✅ Onboarding efficiency (historical context)
- ✅ Reduced rework (remember why decisions were made)
- ✅ Knowledge retention (team changes don't lose context)

---

## Tips for Success

1. **Be Consistent**: Always store important decisions
2. **Be Specific**: Include relevant details and context
3. **Use IDs**: Link documents to GitHub issues
4. **Update Regularly**: Keep status current
5. **Query Before Deciding**: Check for existing context
6. **Document Rationale**: Future you will thank you
7. **Link Related Items**: Build knowledge graph
8. **Regular Reviews**: Keep data current and relevant

---

**Last Updated**: October 21, 2025  
**Related**: `.github/copilot-prompts/project-planner.md`
