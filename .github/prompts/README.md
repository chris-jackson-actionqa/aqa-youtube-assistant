# GitHub Copilot Prompts

This directory contains specialized Copilot prompts that can be invoked for specific tasks.

## Available Prompts

### 🧪 [jest-unit-tester.md](./jest-unit-tester.md)
**Purpose**: Jest unit testing agent for frontend code  
**When to use**: Writing new tests, improving coverage, debugging test failures  
**Invoke with**: Reference this file in your request or use `@workspace` with testing keywords

### 📋 [project-planner.md](./project-planner.md)
**Purpose**: Strategic project planning and GitHub issue management with persistent context  
**When to use**: Breaking down features, creating issues, sprint planning, tracking progress  
**Invoke with**: Reference this file or use natural language like "plan the next sprint"  
**MCP Servers**: GitHub (issues, epics, labels) + Chroma DB (context persistence)  
**Guides**: 
- [CHROMA_DB_GUIDE.md](./CHROMA_DB_GUIDE.md) - Chroma DB usage patterns
- [PLANNER_EXAMPLES.md](./PLANNER_EXAMPLES.md) - Usage examples and invocation methods

### 🐍 [backend-developer-agent.md](./backend-developer-agent.md)
**Purpose**: Backend development agent for FastAPI, SQLAlchemy, and RESTful APIs  
**When to use**: Building new endpoints, database models, API features, backend bug fixes  
**Invoke with**: Reference this file or use natural language like "implement the projects API"  
**MCP Servers**: GitHub (issues, branching) + Chroma DB (context) + Postman (API testing)  
**Key Principles**: 
- Never guess requirements - always ask for clarification
- Code in small, reviewable increments with frequent commits
- 95%+ test coverage required for all backend code
- Only implement what's requested (no extra features)

### 🚀 [deployment-agent.md](./deployment-agent.md)
**Purpose**: Deployment expert for building, packaging, and deploying to Linux Pop_OS  
**When to use**: Creating deployment scripts, production configs, deployment docs, systemd services  
**Invoke with**: Reference this file or use natural language like "create the build script for production"  
**MCP Servers**: GitHub (issues, branching) + Context7 (latest docs) + Chroma DB (deployment context)  
**Key Principles**:
- Never guess deployment requirements - always ask for clarification
- Work in small, testable tasks with frequent commits
- Test all scripts manually before committing
- Focus on Pop_OS Linux environment only
- Document thoroughly for end users
- NEVER use `--no-verify` or reduce coverage thresholds

## How to Use Prompts

### Method 1: Direct Reference
```
@workspace Use the Jest unit tester prompt to add tests for ProjectForm.tsx
```

### Method 2: Natural Language
When you mention testing-related tasks, Copilot will use the relevant context:
```
Add unit tests for the new UserProfile component with 100% coverage
```

### Method 3: File Attachment
Attach the prompt file directly:
```
#file:.github/copilot-prompts/jest-unit-tester.md
Help me write tests for this component
```

## Creating New Prompts

When creating a new specialized prompt:

1. **Name it descriptively**: `{tool}-{purpose}.md` (e.g., `jest-unit-tester.md`)
2. **Include clear sections**:
   - Purpose and when to use
   - Prerequisites and setup
   - Step-by-step methodology
   - Examples and patterns
   - Success criteria
3. **Reference project standards**: Link to relevant docs and config files
4. **Update this README**: Add the new prompt to the list above

## Prompt Invocation from Other Prompts

Prompts can reference each other:

```markdown
For unit testing, see: `.github/copilot-prompts/jest-unit-tester.md`
```

## Integration with Instructions

The main `.github/copilot-instructions.md` provides always-active context.  
Prompts in this directory are specialized agents for specific workflows.
