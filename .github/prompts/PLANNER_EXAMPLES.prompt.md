# Project Planner Usage Examples

This document shows practical examples of how to invoke and use the Project Planner prompt.

---

## Invocation Methods

### Method 1: Direct File Reference
```
#file:.github/copilot-prompts/project-planner.md
Plan out the remaining work for the authentication feature
```

### Method 2: Natural Language (with context)
```
Using the project planning approach, create issues for the video script feature
```

### Method 3: Workspace Reference
```
@workspace Act as the project planner and organize the next sprint
```

---

## Common Use Cases

### 1. Breaking Down a New Feature

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md
We need to add video script management. Break this down into actionable issues.
```

**Expected Actions**:
1. Query Chroma DB for existing architecture decisions
2. Analyze current codebase structure
3. Create Epic issue with clear scope
4. Break down into 5-8 sub-tasks
5. Store planning decisions in Chroma DB
6. Provide sprint plan with estimates

**Output**:
- Epic issue created
- 5-8 specific task issues
- Dependencies mapped
- Time estimates provided
- Context stored in Chroma DB

---

### 2. Sprint Planning

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md
Plan the next 2-week sprint. We have 40 hours of capacity.
```

**Expected Actions**:
1. Query Chroma DB for last sprint retrospective
2. List open issues and priorities
3. Check dependencies and blockers
4. Select issues totaling ~32 hours (80% capacity)
5. Set clear sprint goal
6. Store sprint plan in Chroma DB

**Output**:
- Sprint goal defined
- Issues selected (with links)
- Timeline provided
- Capacity analysis
- Risk mitigation notes

---

### 3. Status Check / Progress Update

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md
What's the status of the Project Management epic?
```

**Expected Actions**:
1. Query Chroma DB for sprint context
2. List all issues in Epic #2
3. Check issue comments for updates
4. Calculate completion percentage
5. Identify blockers
6. Update Epic with status comment

**Output**:
- Completion percentage
- Completed vs remaining work
- Blockers identified
- Next actions recommended
- Updated Epic comment

---

### 4. Technical Debt Review

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md
What technical debt do we need to address?
```

**Expected Actions**:
1. Query Chroma DB technical_debt collection
2. Search codebase for TODO comments
3. Review code for antipatterns
4. Prioritize by impact and effort
5. Create issues for high-priority items
6. Update technical debt tracking

**Output**:
- Prioritized list of debt items
- GitHub issues created for top items
- Effort estimates
- Recommended sprint inclusion

---

### 5. Architecture Decision

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md
Should we use WebSockets or Server-Sent Events for real-time updates?
```

**Expected Actions**:
1. Query Chroma DB for related decisions
2. Evaluate both options with pros/cons
3. Consider project context (scale, team, etc.)
4. Make recommendation with rationale
5. Store decision in Chroma DB

**Output**:
- Clear recommendation
- Pros/cons comparison
- Implementation guidance
- Decision stored for future reference
- Related issues linked

---

### 6. Retrospective

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md
Run a sprint retrospective for Sprint 1
```

**Expected Actions**:
1. Query Chroma DB for sprint plan
2. Review completed vs planned issues
3. Calculate velocity
4. Gather learnings
5. Update retrospective in Chroma DB
6. Provide recommendations

**Output**:
- Velocity calculated
- What went well
- What to improve
- Action items for next sprint
- Updated Chroma DB retrospective

---

### 7. Backlog Grooming

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md
Review and prioritize the backlog
```

**Expected Actions**:
1. List all open issues
2. Query Chroma DB for roadmap priorities
3. Assess value vs effort
4. Check for stale issues
5. Update priorities and labels
6. Group related issues

**Output**:
- Reprioritized backlog
- Grouped epics
- Stale issues identified
- Quick wins highlighted
- Recommendations for next sprint

---

### 8. Creating Sub-Issues for an Epic

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md
Epic #2 needs more detailed breakdown. Create sub-issues.
```

**Expected Actions**:
1. Read Epic #2 description
2. Query Chroma DB for context
3. Identify missing work
4. Create 3-5 new issues
5. Link to Epic
6. Update Epic with new tasks

**Output**:
- New issues created
- Dependencies mapped
- Epic updated
- Context stored
- Sprint plan adjusted

---

## Advanced Usage

### Combining with Other Prompts

**Testing + Planning**:
```
#file:.github/copilot-prompts/project-planner.md
Create an issue for adding tests to ProjectList component.
Include requirements from jest-unit-tester prompt.
```

**Code Review + Planning**:
```
After reviewing this PR, create follow-up issues for:
1. Technical debt identified
2. Future enhancements suggested
3. Documentation needs
```

---

### Multi-Step Planning

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md

We need to add these features:
1. User authentication
2. Video script editor
3. Collaboration features

Create epics and prioritize them.
```

**Expected Actions**:
1. Query Chroma DB for roadmap
2. Create 3 epic issues
3. Estimate effort for each
4. Prioritize based on dependencies and value
5. Create high-level timeline
6. Store roadmap in Chroma DB

---

### Context-Aware Planning

**User Request**:
```
#file:.github/copilot-prompts/project-planner.md

Based on what we learned in the last sprint, plan the next one.
```

**Expected Actions**:
1. Query Chroma DB for retrospective
2. Apply learnings to estimates
3. Address identified issues
4. Adjust capacity based on velocity
5. Create improved sprint plan

---

## Tips for Effective Use

### 1. Provide Context
```
❌ "Create some issues"
✅ "Create issues for the video script feature, focusing on CRUD operations"
```

### 2. Be Specific About Scope
```
❌ "Plan the project"
✅ "Plan the next 2-week sprint for the Project Management epic"
```

### 3. Reference Previous Work
```
✅ "Continue the planning from Epic #2"
✅ "Based on Issue #11, what else needs to be done?"
```

### 4. Leverage Chroma DB Context
```
✅ "What decisions were made about state management?"
✅ "What blocked the last sprint?"
✅ "What's on the roadmap?"
```

### 5. Combine Actions
```
✅ "Review Epic #2 status, update comments, and plan next sprint"
```

---

## Output Expectations

### For Feature Breakdown
- Epic issue with clear scope
- 5-10 sub-issues with details
- Dependency graph
- Time estimates
- Sprint recommendation

### For Sprint Planning
- Clear sprint goal
- Selected issues with estimates
- Timeline and milestones
- Risk analysis
- Capacity buffer

### For Status Updates
- Completion percentage
- Completed work summary
- In-progress items
- Blockers with solutions
- Next actions

### For Decision Making
- Recommendation with rationale
- Alternatives considered
- Trade-offs analyzed
- Implementation guidance
- Context stored

---

## Troubleshooting

### Issue: "Too broad, can't plan effectively"
**Solution**: Be more specific about scope and timeframe
```
❌ "Plan everything"
✅ "Plan the next sprint for frontend work"
```

### Issue: "Missing context about previous decisions"
**Solution**: Ensure Chroma DB has been populated
```
✅ First, store architecture decisions in Chroma DB
✅ Then query before planning new features
```

### Issue: "Estimates seem off"
**Solution**: Provide historical data
```
✅ "Issue #11 took 3 hours instead of 1-2. Adjust future estimates."
```

### Issue: "Issues too large"
**Solution**: Request breakdown
```
✅ "Break Issue #8 into smaller tasks (2-4 hours each)"
```

---

## Integration Checklist

When using the Project Planner, ensure:
- [ ] Chroma DB MCP server is enabled
- [ ] GitHub MCP server is enabled
- [ ] Previous planning context is stored
- [ ] Project documentation is up to date
- [ ] Team capacity is known
- [ ] Priorities are clear

---

**Last Updated**: October 21, 2025  
**Related Files**:
- `.github/copilot-prompts/project-planner.md` - Full prompt
- `.github/copilot-prompts/CHROMA_DB_GUIDE.md` - Chroma DB patterns
- `.github/copilot-instructions.md` - Project context
