# Title Template Feature - Planning Questions

**Date**: November 13, 2025  
**Status**: Discovery Phase  
**Related**: Future Epic for Title Template Management

---

## Overview

This document contains clarifying questions for planning the Title Template feature. The feature will allow users to create, manage, and apply reusable video title templates with placeholder text that can be customized for each video.

**User's Initial Requirements**:
- Store multiple title templates
- CRUD operations (Create, Read, Update, Delete)
- Templates manageable outside project details page
- Apply template to project video title from project page
- Prompt before overwriting existing titles
- Manual keyword filling initially (AI in future)
- Always allow manual editing of video title

---

## 1. Template Data Model & Storage

### Q1.1: User Scope
Should templates be **user-specific** or **shared across the entire application**?
- Will different users have their own templates?
- Or is this for a single-user application where all templates are global?

**Context**: Determines authentication/authorization requirements

---

### Q1.2: Template Metadata
What **metadata** should templates store beyond the template text?

Potential fields:
- [ ] Template name/label (e.g., "Best Tools Template", "How-To Template")
- [ ] Date created/updated
- [ ] Usage count (how many times applied)
- [ ] Last used date
- [ ] Tags or categories (e.g., "Tutorial", "Review", "List")
- [ ] Notes/description about when to use this template

**Context**: Affects database model design and UI complexity

---

### Q1.3: Workspace Association
Should templates be associated with **workspaces** or remain global?
- Given the multi-workspace architecture, should each workspace have its own set of templates?
- Or should templates be app-wide and usable across all workspaces?

**Context**: Affects data model (foreign key to workspace) and filtering logic

---

## 2. Template Format & Syntax

### Q2.1: Placeholder Syntax
How should **placeholder syntax** work in templates?

**Option A: Bracket notation**
```
"Best [tools, practices, or technologies] for Software Testers in 2025"
```

**Option B: Curly braces (programmer-friendly)**
```
"Best {tools} for Software Testers in {year}"
```

**Option C: Mustache-style**
```
"Best {{category}} for Software Testers in {{year}}"
```

Which syntax do you prefer?

**Context**: Affects parsing logic and user documentation

---

### Q2.2: Named Placeholders
Should placeholders have **names/labels** for clarity?

**Example with names**:
```
"Best [CATEGORY: tools, practices, or technologies] for [AUDIENCE] in [YEAR]"
```

When applied, could show:
- CATEGORY: [input field with hint: "tools, practices, or technologies"]
- AUDIENCE: [input field]
- YEAR: [input field]

Is this level of structure desirable?

**Context**: More complex but provides better UX guidance

---

### Q2.3: Template Variations
Should templates support **multiple variations** of the same structure?

**Example**:
```
"Best [keyword] for Software Testers in 2025"

Alternative phrasings:
- "Top [keyword] for Software Testers in 2025"
- "Essential [keyword] for Software Testers in 2025"
```

Should these be:
- Separate templates?
- Variations within one template (select at apply time)?

**Context**: Affects template storage and selection UI

---

## 3. Template Management UI

### Q3.1: Navigation Location
Where should the **Template Manager** live in the navigation?

**Options**:
- Top-level navigation link (alongside Projects)
- Settings/Configuration section
- Tools/Utilities menu
- Dedicated "Templates" page at `/templates`

**Context**: Affects navigation structure and user discoverability

---

### Q3.2: Management Actions
What **actions** should be available in the Template Manager?

Potential actions:
- [ ] Create new template
- [ ] Edit existing template
- [ ] Delete template
- [ ] Duplicate template
- [ ] Reorder templates (for prioritization)
- [ ] Archive/disable templates (keep but don't show in active list)
- [ ] Import/Export templates (for backup or sharing)

Which are **must-have** vs **nice-to-have**?

**Context**: Affects UI complexity and API endpoints

---

### Q3.3: Default Templates
Should there be a **default/starter templates** feature?
- Pre-populate with a few example templates when user first starts?
- Allow resetting to defaults?

**Context**: Improves onboarding experience

---

## 4. Applying Templates on Project Page

### Q4.1: Template Selection UI
How should the **template selection UI** work on the project detail page?

**Option A: Dropdown menu next to video title**
```
[Current Title] [🔽 Apply Template]
```

**Option B: Button that opens a modal/popover**
```
[Current Title] [📋 Templates]
```

**Option C: Inline template browser**
```
[Current Title] [✏️ Edit] [📋 Apply Template]
  - Template 1
  - Template 2
  - Custom input
```

**Context**: Affects VideoTitleEditor component redesign

---

### Q4.2: Template Application Mode
When a template is applied, should it **replace** or **suggest**?

**Options**:
- **Replace mode**: Insert template text directly into video_title field
- **Suggest mode**: Show template in a preview, allow editing before applying
- **Smart merge**: If there's existing content, offer to merge or replace

**Context**: Affects UX flow and confirmation dialogs

---

### Q4.3: Template Tracking
Should the system **remember** which template was used for each project?

Potential benefits:
- Track `template_id` on the Project model
- Show "Applied from: Best Tools Template" on the project page
- Analytics: "Which templates perform best?"

Is this tracking valuable?

**Context**: Affects Project model and potential analytics features

---

### Q4.4: Overwrite Confirmation Dialog
If a title already exists, what should the **confirmation dialog** say?

**Option A: Simple**
```
"Replace existing video title with template?"
[Cancel] [Replace]
```

**Option B: Detailed**
```
"Replace video title?"
Current: "Old Title Here"
Template: "Best [keyword] for..."
[Cancel] [Preview] [Replace]
```

**Option C: Side-by-side comparison**
```
Old: [Old Title]
New: [Template]
[Keep Old] [Use Template] [Edit First]
```

**Context**: Affects confirmation dialog design

---

## 5. Template Editing & Management

### Q5.1: Validation Rules
Should templates have **validation rules**?

Potential validations:
- [ ] Minimum/maximum length
- [ ] Required placeholders (must have at least one)
- [ ] Forbidden characters
- [ ] Prevent duplicate template text
- [ ] YouTube title length restrictions (100 chars max)

**Context**: Affects Pydantic schema validation

---

### Q5.2: Template Preview
Should there be a **template preview** feature?
- Show example of what the filled-in template might look like?
- Test placeholder substitution before saving?

**Context**: Adds UI complexity but improves usability

---

### Q5.3: Template Versioning
Should templates support **versioning**?
- Keep history of template changes?
- Revert to previous version?

**Note**: Likely overkill for MVP

**Context**: Adds significant database and UI complexity

---

## 6. Future AI Integration

### Q6.1: AI Context
For future AI keyword filling, what **context** should the AI use?

Potential context sources:
- [ ] Project name
- [ ] Project description
- [ ] Previous video titles
- [ ] Competitor video titles (if stored)
- [ ] Current trends or keywords

**Context**: Informs future feature planning

---

### Q6.2: AI-Ready Data Model
Should we design the data model to **accommodate future AI fields** now?

Potential fields:
- Template with AI-suggested keywords
- Confidence scores for AI suggestions
- Manual override flags for AI suggestions

**Context**: Planning for future extensibility

---

## 7. Technical Architecture

### Q7.1: Database Storage
Should templates be stored in the **same database** or separate?
- Add `TitleTemplate` model to `backend/app/models.py`?
- Or use a separate templates database/service?

**Context**: Affects migration strategy and API design

---

### Q7.2: API Endpoints
Should template operations use **REST API** pattern?

**Proposed endpoints**:
```
POST   /api/templates              - Create template
GET    /api/templates              - List all templates
GET    /api/templates/{id}         - Get single template
PUT    /api/templates/{id}         - Update template
DELETE /api/templates/{id}         - Delete template
POST   /api/projects/{id}/apply-template - Apply template to project
```

Follows existing project patterns?

**Context**: Consistency with existing API design

---

### Q7.3: Frontend Routes
Should templates have their **own frontend route/page**?

**Proposed routes**:
```
/templates              - Template manager page
/templates/new          - Create new template
/templates/{id}/edit    - Edit existing template
```

Or keep it simpler with modal-based editing?

**Context**: Affects routing and navigation structure

---

## 8. User Experience & Workflow

### Q8.1: Template Change Frequency
What's the expected **frequency** of template changes?
- Weekly?
- Monthly?
- Rarely?

**Context**: Affects how prominent the Template Manager should be in UI

---

### Q8.2: Keyboard Shortcuts
Should there be **keyboard shortcuts** for template operations?

Potential shortcuts:
- Quick apply template: `Ctrl+T`
- Open template manager: `Ctrl+Shift+T`

**Context**: Power user feature, adds complexity

---

### Q8.3: Template Ordering
Should templates be **orderable/sortable**?

Potential features:
- [ ] Drag-and-drop reordering in template manager
- [ ] Sort by: date created, date modified, usage count, alphabetical
- [ ] Pin favorites to top

**Context**: Affects database model (order field) and UI complexity

---

## 9. Migration & Data

### Q9.1: Extract Template Feature
For existing projects with video titles, should we offer **"Extract Template"** feature?

Potential features:
- Analyze existing titles to suggest template patterns
- Auto-detect common patterns across multiple titles

**Note**: Future enhancement, but affects architecture planning

**Context**: Helps users migrate existing content to templates

---

## 10. Prioritization for MVP

### Q10.1: Feature Priority
Which features are **must-have for MVP** vs nice-to-have?

**Recommended MVP (Must-Have)**:
- ✅ CRUD operations for templates
- ✅ Basic template manager page
- ✅ Apply template to project video title
- ✅ Overwrite confirmation dialog
- ✅ Simple bracket placeholder syntax `[keyword]`
- ✅ Template name/label and template text

**Recommended Future Enhancements (Nice-to-Have)**:
- 🔮 Template usage analytics
- 🔮 Template categories/tags
- 🔮 Import/export templates
- 🔮 Template preview with example fills
- 🔮 AI keyword filling
- 🔮 Keyboard shortcuts
- 🔮 Template variations
- 🔮 Named placeholders with hints
- 🔮 Drag-and-drop reordering
- 🔮 Extract template from existing titles

Do these priorities align with your vision?

**Context**: Defines initial epic scope

---

## Architectural Recommendations

Based on existing codebase patterns:

1. **Follow existing patterns**: Use SQLAlchemy model, Pydantic schemas, REST API (like Projects/Workspaces)
2. **Keep templates global** (not workspace-specific) initially - simpler MVP
3. **Use bracket notation** `[keyword]` - matches user's example, simple for users
4. **Dedicated `/templates` route** - keeps feature organized and discoverable
5. **Simple replacement with confirmation** - clearest UX for MVP
6. **Don't track template_id on Project** initially - keep it simple, can add later
7. **Standard FastAPI CRUD endpoints** - consistent with existing API patterns
8. **Separate TemplateManager component** - reusable, testable
9. **Modal-based template selection** - consistent with VideoTitleEditor pattern

---

## Next Steps

1. **Answer questions** - Go through each question one at a time
2. **Document decisions** - Record answers in this file
3. **Create epic** - Generate comprehensive epic issue on GitHub
4. **Break down into stories** - Create detailed sub-issues for implementation
5. **Estimate and prioritize** - Assign time estimates and sprint planning

---

**Decision Log**: (Answers will be recorded below as questions are answered)

### Q1.1: User Scope ✅ ANSWERED
**Decision**: Single-user application with global templates
- Templates are shared across all projects and workspaces
- No user authentication or ownership tracking needed
- Simpler data model without user_id foreign key

**Date**: November 13, 2025

---

### Q1.2: Template Metadata ✅ ANSWERED
**Decision**: Minimal metadata for MVP, extensible for future
- **MVP (Now)**: Template name/label + template text only
- **Future enhancements**: Add later via migrations
  - Date created/updated (timestamps)
  - Usage count (track applications)
  - Last used date

**Rationale**: Keep MVP simple, database schema can evolve
**Date**: November 13, 2025

---

### Q2.1: Placeholder Syntax ✅ ANSWERED
**Decision**: Double braces with free-form hints
- **Format**: `{{tools, practices, or technologies}}`
- **Example**: "Best {{tools, practices, or technologies}} for Software Testers in 2025"

**MVP Behavior**:
- Store template text exactly as written (no parsing)
- When applied, entire placeholder appears in video title
- User manually edits placeholder text to desired value
- Simple text insertion - no parsing logic needed

**Future AI Enhancement**:
- AI can read natural language hints inside braces
- Placeholder content provides context for intelligent suggestions
- Can evolve to structured format later without breaking changes

**Rationale**: Keep MVP simple, human-readable, AI-friendly for future
**Date**: November 13, 2025

---

### Q3.1: Navigation Location ✅ ANSWERED
**Decision**: Top-level navigation link

**Implementation**:
- Add "Templates" link to main navigation (same level as Projects)
- Route: `/templates` for template manager page
- Easily discoverable and accessible

**Rationale**: Templates are a core feature, deserve prominent placement
**Date**: November 13, 2025

---

### Q3.2: Management Actions ✅ ANSWERED
**Decision**: Basic CRUD operations only for MVP

**MVP Actions**:
- ✅ **Create** new template
- ✅ **Read/List** all templates
- ✅ **Update/Edit** existing template
- ✅ **Delete** template

**Future Enhancements** (not in MVP):
- 🔮 Duplicate template
- 🔮 Reorder/sort templates
- 🔮 Archive templates
- 🔮 Import/export templates

**Rationale**: Keep MVP scope minimal, add features based on actual usage
**Date**: November 13, 2025

---

### Q4.1: Template Selection UI ✅ ANSWERED
**Decision**: Separate "Templates" button next to edit button

**UI Layout**:
```
[Current Video Title]  [✏️ Edit]  [📋 Templates]
```

**Interaction Flow**:
1. Click "Templates" button
2. Shows list/menu of available templates
3. Click to select a template
4. If video title exists → Show confirmation dialog
5. If no video title → Apply directly
6. Template text inserted into video_title field

**Rationale**: Clear separation of manual edit vs template application, simple to understand
**Date**: November 13, 2025

---

### Q4.4: Overwrite Confirmation Dialog ✅ ANSWERED
**Decision**: Simple confirmation showing current title

**Dialog Design**:
```
┌─────────────────────────────────────────┐
│  Replace existing video title?          │
│                                          │
│  This will overwrite:                    │
│  "My Current Video Title"                │
│                                          │
│          [Cancel]  [Replace]             │
└─────────────────────────────────────────┘
```

**Behavior**:
- Show dialog ONLY if video_title is not null/empty
- If video_title is null/empty → Apply template directly without confirmation
- User can see what they're about to lose
- Clear Cancel/Replace action buttons

**Rationale**: Balance between safety and simplicity, prevents accidental overwrites
**Date**: November 13, 2025

---

### Q5.1: Validation Rules ✅ ANSWERED
**Decision**: Implement comprehensive validation for template quality

**Validation Rules**:

1. **Length Limits**:
   - Maximum: 256 characters
   - Rationale: Template is not final title, needs room for placeholder hints

2. **Placeholder Requirements**:
   - Must have at least one `{{placeholder}}`
   - No empty placeholders: `{{}}` is invalid
   - Prevents creating static text as "templates"

3. **Duplicate Prevention**:
   - Case-insensitive uniqueness check on template text
   - Prevent exact duplicate templates (e.g., "Best {{tool}}" vs "best {{tool}}")
   - Check applies to both create and update operations

4. **Whitespace Handling**:
   - Trim leading/trailing whitespace from template text
   - Trim leading/trailing whitespace from template name
   - Empty templates (blank or whitespace-only) are rejected

5. **Empty Prevention**:
   - Template text cannot be empty or whitespace-only
   - Template name cannot be empty or whitespace-only

**Implementation**:
- Pydantic validators in schemas.py
- Database constraint for case-insensitive uniqueness (functional index on LOWER())
- Clear error messages for validation failures

**Rationale**: Ensure template quality, prevent user errors, maintain data integrity
**Date**: November 13, 2025

---

### Q7.2: API Endpoints ✅ ANSWERED
**Decision**: Query parameter approach for template type filtering

**API Endpoints**:
```
POST   /api/templates              - Create template (type in body)
GET    /api/templates              - List all templates (all types)
GET    /api/templates?type=title   - List templates of specific type
GET    /api/templates/{id}         - Get single template
PUT    /api/templates/{id}         - Update template
DELETE /api/templates/{id}         - Delete template
```

**Request/Response Format**:
```json
{
  "type": "title",
  "name": "Best Tools Template",
  "content": "Best {{tools, practices, or technologies}} for Software Testers in 2025"
}
```

**Database Model**:
- Single `Template` model with `type` field (e.g., 'title', 'description', etc.)
- Case-insensitive unique constraint on `(type, content)` combination
- Supports wildly different template types in the future

**Benefits**:
- ✅ Single set of CRUD endpoints
- ✅ Easy to add new template types without new routes
- ✅ Can query all templates or filter by type
- ✅ Simple implementation and maintenance
- ✅ Flexible for future unknown template types

**Rationale**: Balances simplicity with extensibility for unknown future requirements
**Date**: November 13, 2025

---

### Q10.1: MVP Scope Confirmation ✅ ANSWERED
**Decision**: MVP scope confirmed and approved

**IN SCOPE - MVP Features**:

**Backend**:
- ✅ Template database model (type, name, content)
- ✅ Database migration
- ✅ REST API with query parameter filtering
- ✅ Comprehensive validation (256 chars, placeholders, duplicates, whitespace)
- ✅ Unit tests (95%+ coverage)
- ✅ Integration tests

**Frontend**:
- ✅ /templates page with CRUD operations
- ✅ Top-level navigation link
- ✅ Template selector on project detail page
- ✅ Overwrite confirmation dialog
- ✅ Unit tests (98%+ coverage)
- ✅ E2E tests

**OUT OF SCOPE - Future Enhancements**:
- Usage analytics (count, last used)
- Tags/categories
- Duplicate/Archive features
- Import/export
- Template preview
- AI filling
- Keyboard shortcuts
- Named placeholders
- Template tracking per project

**Date**: November 13, 2025
**Status**: ✅ READY FOR EPIC CREATION

---
