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
