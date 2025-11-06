# Next Epic Ideas - Brainstorming Session
**Date**: November 3, 2025  
**Status**: Ideation - No implementation yet

---

## 🎯 Vision Overview

Moving from project management to **video content creation tools**, starting with title generation and management.

---

## 🎬 Core Features Requested

### 1. Project Detail Navigation
- **Current**: Project list with basic display
- **Next**: Click a project → Navigate to dedicated project page
- **Goal**: Deep dive into individual project details

### 2. Video Title Management
- Add new video titles
- Edit existing titles
- View/manage multiple title options

### 3. AI-Powered Title Generation
- Generate compelling title ideas
- Analyze competitive titles
- Optimize for click-through rate (CTR)

### 4. Title Templates
- Create custom templates
- Edit existing templates
- Delete/remove templates
- Apply templates to generate titles

---

## 🏗️ Architecture Considerations

### Navigation Pattern: Hub & Spoke Model

**Option A: Project Hub with Feature Spokes**
```
Project List
    ↓ (click project)
Project Detail Page (Hub)
    ├─→ Title Workshop (dedicated page)
    ├─→ Description Editor (dedicated page)
    ├─→ Script Builder (dedicated page)
    └─→ [Other features...]
```

**Pros:**
- Clean separation of concerns
- Deep focus on each feature
- Easy to add new tools later
- Each "workshop" can have rich tooling

**Cons:**
- More navigation clicks
- Need to handle navigation state
- Potential context switching fatigue

---

**Option B: Project Detail Page with Expandable Sections**
```
Project Detail Page
    ├─ Title Section (expandable/modal)
    ├─ Description Section (expandable/modal)
    ├─ Script Section (expandable/modal)
    └─ [Other sections...]
```

**Pros:**
- Everything on one page
- Quick access to all features
- Less navigation overhead
- Overview of entire project

**Cons:**
- Page could get very long/complex
- Harder to build rich tooling per feature
- Performance concerns with heavy features

---

**Option C: Hybrid Approach** ⭐ *Recommended for Discussion*
```
Project Detail Page (Overview + Quick Edit)
    ├─ Title Preview [Click for Title Workshop →]
    ├─ Description Preview [Click for Description Editor →]
    ├─ Script Preview [Click for Script Builder →]
    └─ Quick Stats/Metadata
```

**Pros:**
- Best of both worlds
- Quick edits from overview
- Deep dives when needed
- Progressive disclosure

**Cons:**
- More complex to build
- Need to decide what's "quick" vs "deep"

---

## 📝 Title Workshop Feature Deep Dive

### User Flow
1. Click on a project in the list
2. Navigate to Project Detail page
3. Click on "Title" section
4. Enter **Title Workshop** (dedicated page or modal)

### Title Workshop Components

#### Core Features
- **Title Input**: Manual entry and editing
- **AI Generator**: "Generate Ideas" button
- **Template Selector**: Choose from saved templates
- **Competitive Analysis**: Analyze similar titles
- **Title Library**: View/manage multiple title options

#### Template System
```
Template Structure:
- Template Name: "[Number] Ways to [Action] [Topic]"
- Variables: {number}, {action}, {topic}
- Category: How-To, Listicle, Tutorial, etc.
- AI Prompt Override: Custom instructions for this template
```

**CRUD Operations:**
- Create: Add new template with variables
- Read: View all templates, preview with sample data
- Update: Edit template structure, rename, recategorize
- Delete: Remove unused templates

#### AI Title Generation Strategy

**Approach 1: Template-Based Generation**
- User selects template
- AI fills in variables based on project context
- Generate 5-10 variations
- Example: Template "[Number] [Adjective] Ways to [Action]"
  - Output: "7 Proven Ways to Boost Engagement"

**Approach 2: Competitive Analysis**
- User provides competitor video URLs or titles
- AI analyzes patterns (length, keywords, emotional triggers)
- Generate titles matching successful patterns
- Show "similarity score" to competitors

**Approach 3: Free-Form Generation**
- User provides video topic/description
- AI generates multiple title styles:
  - Listicle: "Top 10 Ways to..."
  - How-To: "How to Master [Topic] in 30 Days"
  - Question: "Why Do [Thing]? The Truth Revealed"
  - Urgency: "Stop [Mistake] - Do This Instead"

**Approach 4: Hybrid** ⭐
- Start with project context
- Optionally apply template
- Optionally reference competitor titles
- Generate diverse options across multiple styles
- Let user rate/favorite titles to improve future suggestions

---

## 🗄️ Data Model Considerations

### ✅ REVISED: Project = Video (1:1)

**Project Model (Enhanced)**
```python
class Project(Base):
    # Existing fields
    id: int
    name: str  # Project name (can be different from video title)
    created_at: datetime
    updated_at: datetime
    
    # NEW: Video content fields
    video_title: str (nullable)  # The actual video title
    video_description: str (nullable)
    video_script: str (nullable)
    thumbnail_url: str (nullable)  # Future
    
    # NEW: Metadata
    target_keywords: List[str] (JSON)  # SEO keywords
    competitor_urls: List[str] (JSON)  # YouTube URLs for research
    
    # Relationships
    title_candidates: List[TitleCandidate]  # Multiple title options
    templates: List[ProjectTemplate]  # Templates used/saved
```

**TitleCandidate** (Multiple title options per project)
```python
class TitleCandidate(Base):
    id: int
    project_id: int  # FK to Project
    title_text: str
    source: str  # 'manual', 'ai_generated', 'template'
    template_id: int (nullable)  # FK to TitleTemplate if used
    is_selected: bool  # Which title is the active one
    
    # AI/Analytics data
    seo_score: float (nullable)  # SEO effectiveness 0-100
    viral_score: float (nullable)  # AI prediction of virality
    character_count: int
    
    # User feedback
    user_rating: int (nullable)  # User rating 1-5
    notes: str (nullable)
    
    created_at: datetime
```

**TitleTemplate** (Global template library)
```python
class TitleTemplate(Base):
    id: int
    user_id: int (nullable)  # NULL = system template, else user-created
    
    # Template definition
    name: str  # "Technology Tools Template"
    template_text: str  # "Best [technology] Tools for [year]"
    variables: List[str] (JSON)  # ["technology", "year"]
    
    # Categorization
    category: str  # 'listicle', 'how-to', 'comparison', 'tutorial', etc.
    tags: List[str] (JSON)  # ['tech', 'tools', 'annual']
    
    # Context & Examples
    context_prompt: str (nullable)  # "Describe what your video covers..."
    example_titles: List[CompetitorExample] (JSON)  # See below
    
    # Usage & Performance
    usage_count: int  # How many times used
    avg_viral_score: float (nullable)  # Avg score of titles generated from this
    
    created_at: datetime
    updated_at: datetime
```

**CompetitorExample** (Stored in TitleTemplate.example_titles JSON)
```json
{
  "title": "Best AI Tools for 2025",
  "video_url": "https://youtube.com/watch?v=...",
  "channel_name": "Tech Review Channel",
  "view_count": 1200000,
  "publish_date": "2024-11-01",
  "engagement_rate": 8.5,  // likes + comments / views
  "notes": "Strong hook, specific year, trending topic"
}
```

**ProjectTemplate** (Link between Project and Templates used)
```python
class ProjectTemplate(Base):
    id: int
    project_id: int  # FK to Project
    template_id: int  # FK to TitleTemplate
    
    # Values filled in for this project
    variable_values: dict (JSON)  # {"technology": "AI", "year": "2025"}
    context_text: str (nullable)  # User's description of their video
    
    # Generated titles from this template
    generated_count: int  # How many titles generated
    
    created_at: datetime
```

---

## 🔗 Relationships & Flow

### Database Relationships
```
Project (1) ─→ (Many) TitleCandidate
Project (1) ─→ (Many) ProjectTemplate ─→ (1) TitleTemplate
TitleTemplate (1) ─→ (Many) ProjectTemplate
TitleCandidate (Many) ─→ (1, optional) TitleTemplate
```

### API Endpoints Needed

#### Projects (Enhanced)
- `GET /api/projects/{id}` - Get project detail with video fields
- `PATCH /api/projects/{id}` - Update project (name, video_title, description, etc.)
- `PATCH /api/projects/{id}/title` - Quick update just the active video title
- `PATCH /api/projects/{id}/description` - Quick update video description
- `PATCH /api/projects/{id}/script` - Quick update video script

#### Title Candidates
- `GET /api/projects/{id}/title-candidates` - List all title options for project
- `POST /api/projects/{id}/title-candidates` - Add new title candidate
  - Body: `{ title_text, source, template_id?, notes? }`
- `GET /api/title-candidates/{id}` - Get specific candidate detail
- `PATCH /api/title-candidates/{id}` - Update title (edit text, rating, notes)
- `DELETE /api/title-candidates/{id}` - Remove title candidate
- `POST /api/title-candidates/{id}/select` - Mark as selected & set as project.video_title

#### AI Generation (Future Phases)
- `POST /api/projects/{id}/title-candidates/generate` - Generate AI title ideas
  - Body: `{ template_id?, context?, competitor_analysis?, count? }`
- `POST /api/title-candidates/analyze` - Analyze title viral potential
  - Body: `{ title_text, project_context?, competitor_urls? }`
  - Response: `{ seo_score, viral_score, suggestions }`

#### Templates
- `GET /api/templates` - List all templates (system + user-created)
  - Query: `?category=listicle&user_only=true`
- `POST /api/templates` - Create new template
  - Body: `{ name, template_text, variables, category, context_prompt?, example_titles? }`
- `GET /api/templates/{id}` - Get template detail with examples
- `PATCH /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template (user-created only)
- `POST /api/templates/{id}/examples` - Add competitor example to template
  - Body: `{ title, video_url, view_count?, notes? }`
- `DELETE /api/templates/{id}/examples/{example_id}` - Remove example

#### Project Templates (Usage tracking)
- `GET /api/projects/{id}/templates` - List templates used for this project
- `POST /api/projects/{id}/templates` - Apply template to project
  - Body: `{ template_id, variable_values, context_text }`
  - Returns: Generated title candidates
- `GET /api/project-templates/{id}` - Get specific usage detail

#### YouTube Integration (Future)
- `GET /api/youtube/video-details?url={url}` - Fetch competitor video metadata
- `GET /api/youtube/search?query={query}` - Search for competitor videos
- `POST /api/projects/{id}/competitors` - Add competitor URLs for analysis

---

## 🎨 UI/UX Considerations

### Project Detail Page (Hub)
**Layout:**
```
┌─────────────────────────────────────┐
│ ← Back to Projects                  │
│                                     │
│ Project: "How to Train Your Dog"   │
│ Created: Nov 1, 2025                │
├─────────────────────────────────────┤
│                                     │
│ 📝 Title                            │
│ "10 Easy Dog Training Tips"   [→]  │
│                                     │
│ 📄 Description                 [→]  │
│ "Learn how to train your dog..."    │
│                                     │
│ 📜 Script                      [→]  │
│ "Welcome back to my channel..."     │
│                                     │
│ 📊 Analytics                   [→]  │
│                                     │
└─────────────────────────────────────┘
```

### Title Workshop Page
**Layout:**
```
┌─────────────────────────────────────┐
│ ← Back to Project                   │
│                                     │
│ Title Workshop                      │
│ Project: "How to Train Your Dog"   │
├─────────────────────────────────────┤
│                                     │
│ ✍️ Current Title                    │
│ ┌─────────────────────────────┐   │
│ │ 10 Easy Dog Training Tips   │   │
│ └─────────────────────────────┘   │
│                                     │
│ 🤖 AI Tools                         │
│ [Generate Ideas] [Analyze Title]   │
│ [Use Template ▼]                   │
│                                     │
│ 💡 Title Ideas (3)                  │
│ ┌─────────────────────────────┐   │
│ │ ⭐ 10 Easy Dog Training Tips │   │
│ │ Rating: ⭐⭐⭐⭐⭐ | [Edit] [Use]   │
│ ├─────────────────────────────┤   │
│ │ Train Your Dog in 10 Days   │   │
│ │ Rating: ⭐⭐⭐⭐ | [Edit] [Use]     │
│ ├─────────────────────────────┤   │
│ │ Dog Training Made Simple    │   │
│ │ Rating: ⭐⭐⭐ | [Edit] [Use]       │
│ └─────────────────────────────┘   │
│                                     │
│ 📋 Templates (5)                    │
│ [View All Templates]                │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ DECISIONS MADE (Nov 4, 2025)

### 1. Navigation Architecture ✅
- **DECISION**: Hub & Spoke - Multiple dedicated pages
- **Rationale**: Each feature (Title, Description, Script) is complex enough to warrant its own focused workspace
- **Implementation**: Hybrid approach with quick preview on Project Detail, click to open dedicated workshop

### 2. Video Entity ✅
- **DECISION**: Project IS the Video (1:1 relationship)
- **Clarification**: A "Project" is a "Video Project" - they are synonymous
- **Data Model**: No separate Video entity needed, just add fields to Project
- **Future**: If multi-video per project needed, we can refactor later

### 3. AI Integration Strategy ✅
- **DECISION**: Pretty smart - Focus on virality, YouTube analytics, and SEO
- **Goal**: Make the most viral video possible by leveraging competitor research
- **Services Needed**: 
  - AI generation service (OpenAI/Claude)
  - YouTube Data API for competitor analysis
  - SEO scoring capabilities
- **Phases**:
  - **Phase 0**: Manual title input only (MVP)
  - **Phase 1**: Template-based generation
  - **Phase 2**: Free-form AI generation with context
  - **Phase 3**: Competitive analysis + YouTube analytics

### 4. Template Complexity ✅
- **DECISION**: Keep it simple - String replacement patterns
- **Format**: "Best [technology] Tools for 2025"
- **Features**:
  - Variable placeholders in brackets
  - Additional context text input for video details
  - Store example competitive titles using that template format
- **Example Template**:
  ```
  Template: "Best [technology] Tools for [year]"
  Context: "Video about productivity software for developers"
  Competitor Examples:
    - "Best AI Tools for 2025" (1.2M views)
    - "Best Coding Tools for 2025" (856K views)
  ```

### 5. Competitive Analysis Features ✅
- **DECISION**: Core feature, not optional
- **Priority**: High - This is a key differentiator
- **Integration**: YouTube Data API for views, engagement metrics
- **Storage**: Store competitor examples with templates and per-project

### 6. Title Selection Workflow
- **TO DISCUSS**: How to manage multiple title variations?
- **Options**: 
  - Single "active" title field on Project
  - Or list of title candidates with one marked primary?

### 7. Mobile Responsiveness
- **TO DISCUSS**: Desktop-first or mobile-friendly?
- **Assumption**: Desktop-first (content creation typically desktop)

---

## 🎯 SIMPLIFIED Epic Plan

### ✅ DECISION: Start Ultra-Simple (Nov 4, 2025)
**Stripped down to bare essentials - Just navigation, no new features**

### ✅ DESIGN DECISIONS (Nov 4, 2025)

**Clickable Area**: Entire card/row is clickable
- Click anywhere on project card → Navigate to detail page
- Delete button must stop propagation (don't navigate when deleting)

**Visual Design**: Simple and minimal
- Keep current styling approach
- Focus on functionality, not fancy design
- Polish visual design later

**Error Handling**: 404 page for invalid project IDs
- Show clear error message
- Provide link back to Projects List
- Standard 404 pattern

---

## Epic 1: Project Detail Navigation (MVP v1)
**Goal**: Click a project → Navigate to dedicated detail page
**Duration**: 3-5 days
**Value**: Foundation for all future features, proves navigation pattern

### What We're Building
A simple detail page that shows:
- Project name
- Created date  
- Updated date
- Back button to project list

**That's it. No editing. No new fields. Just read-only display.**

---

### User Flow
```
1. User is on Projects List page
2. User clicks a project (anywhere on the row or a "View" button)
3. Browser navigates to /projects/{id}
4. Detail page loads project data
5. Shows project info
6. User clicks "← Back to Projects"
7. Returns to list
```

---

### Technical Implementation

#### Frontend Changes

**1. Update Project List Component**
- File: `frontend/app/projects/page.tsx` (or wherever list is)
- Add click handler or Link wrapper to each project
- Route: `href="/projects/${project.id}"`
- Option A: Make entire row clickable
- Option B: Add "View Details" button/icon

**2. Create Project Detail Route**
- Create: `frontend/app/projects/[id]/page.tsx`
- Use Next.js dynamic routing `[id]`

**3. Create Project Detail Component**
- Fetch project data using existing `GET /api/projects/{id}` endpoint
- Display project info in clean layout
- Add back navigation (Next.js Link or browser back)

**4. Optional: Update Navigation/Breadcrumbs**
- Show current location: Projects > [Project Name]

---

#### Backend Changes

**None required!** 🎉

Existing endpoint already works:
- `GET /api/projects/{id}` - Returns project with id, name, created_at, updated_at

---

### Detailed Stories

#### Story 1: Add Navigation from Project List
**Task**: Make entire project card clickable  
**Time**: 2-3 hours

**Acceptance Criteria:**
- [ ] Entire project card/row is clickable
- [ ] Clicking navigates to `/projects/{id}`
- [ ] URL updates correctly
- [ ] Visual feedback on hover (cursor pointer, subtle background change)
- [ ] Delete button still works WITHOUT triggering navigation
- [ ] Delete button stops event propagation

**Implementation:**
```typescript
// Wrap entire card in Link or clickable div
<div 
  onClick={() => router.push(`/projects/${project.id}`)}
  className="project-card hover:bg-gray-50 cursor-pointer transition"
>
  {/* project name, dates, etc. */}
  
  <button 
    onClick={(e) => {
      e.stopPropagation(); // Prevent card click
      handleDelete(project.id);
    }}
    className="delete-button"
  >
    Delete
  </button>
</div>
```

**Key Implementation Details:**
- Use `onClick` handler on card wrapper
- Delete button must call `e.stopPropagation()` to prevent navigation
- Add hover styles for visual feedback
- Maintain existing delete functionality

**Testing:**
- [ ] Click project card → Navigates to detail page
- [ ] Click delete button → Deletes project, does NOT navigate
- [ ] Hover over card → Shows visual feedback (cursor, background)
- [ ] Works for all projects in list

---

#### Story 2: Create Project Detail Page Route
**Task**: Set up Next.js dynamic route  
**Time**: 1 hour

**Acceptance Criteria:**
- [ ] Route `/projects/[id]/page.tsx` exists
- [ ] Accessible via URL directly (deep linking)
- [ ] 404 if project ID doesn't exist
- [ ] 404 page has link back to Projects List

**File Structure:**
```
frontend/app/projects/
  ├── page.tsx              (list page - existing)
  └── [id]/
      ├── page.tsx          (detail page - NEW)
      └── not-found.tsx     (404 page - NEW, optional)
```

**404 Handling:**
```typescript
// In page.tsx, check if project exists
async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await fetchProject(params.id);
  
  if (!project) {
    notFound(); // Triggers not-found.tsx
  }
  
  return <ProjectDetail project={project} />;
}
```

**404 Page:**
```typescript
// not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h1>Project Not Found</h1>
      <p>The project you're looking for doesn't exist.</p>
      <Link href="/projects">← Back to Projects</Link>
    </div>
  );
}
```

**Testing:**
- [ ] Navigate to `/projects/1` → Loads page
- [ ] Navigate to `/projects/999` → Shows 404 page
- [ ] 404 page shows clear error message
- [ ] 404 page has working back link
- [ ] Refresh page → Data persists

---

#### Story 3: Fetch and Display Project Data
**Task**: Call API and render project info  
**Time**: 2-3 hours

**Acceptance Criteria:**
- [ ] Fetches project data from `GET /api/projects/{id}`
- [ ] Displays project name prominently
- [ ] Shows created_at in readable format (e.g., "Nov 1, 2025")
- [ ] Shows updated_at in readable format
- [ ] Loading state while fetching
- [ ] Error state if fetch fails

**Implementation:**
```typescript
// frontend/app/projects/[id]/page.tsx
async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await fetch(`/api/projects/${params.id}`).then(r => r.json());
  
  return (
    <div>
      <h1>{project.name}</h1>
      <p>Created: {formatDate(project.created_at)}</p>
      <p>Updated: {formatDate(project.updated_at)}</p>
    </div>
  );
}
```

**Testing:**
- [ ] Project data displays correctly
- [ ] Dates formatted properly
- [ ] Shows loading state initially
- [ ] Shows error if project not found

---

#### Story 4: Add Back Navigation
**Task**: Let user return to project list  
**Time**: 1 hour

**Acceptance Criteria:**
- [ ] "← Back to Projects" link/button visible
- [ ] Clicking returns to `/projects` list page
- [ ] Maintains scroll position on list (optional nice-to-have)

**Implementation:**
```typescript
<Link href="/projects" className="text-blue-600 hover:underline">
  ← Back to Projects
</Link>
```

**Testing:**
- [ ] Click back → Returns to list
- [ ] Browser back button also works
- [ ] List loads with existing data (no flicker)

---

#### Story 5: Style Project Detail Page
**Task**: Clean, simple, minimal layout for detail page  
**Time**: 1-2 hours

**Acceptance Criteria:**
- [ ] Consistent with existing app design (match current styling)
- [ ] Responsive (mobile + desktop)
- [ ] Clear visual hierarchy (name biggest, dates smaller)
- [ ] Adequate white space and padding
- [ ] Accessible (semantic HTML)
- [ ] **Keep it simple** - No fancy design, just functional

**Design (Minimal):**
```
┌────────────────────────────────────┐
│ ← Back to Projects                 │
│                                    │
│ Project Name                       │  <-- <h1> tag, larger text
│                                    │
│ Created: November 1, 2025          │  <-- <p> tag, smaller text
│ Updated: November 3, 2025          │
│                                    │
└────────────────────────────────────┘
```

**Implementation Notes:**
- Use same CSS/Tailwind classes as existing pages
- Match current Projects List page styling
- Don't worry about making it beautiful - just readable
- Focus on functionality over aesthetics

**Testing:**
- [ ] Looks good on mobile (< 768px)
- [ ] Looks good on desktop (> 1024px)
- [ ] Text is readable (contrast, size)
- [ ] Matches existing app style

---

#### Story 6: Add Unit Tests
**Task**: Test project detail component  
**Time**: 2-3 hours

**Acceptance Criteria:**
- [ ] Test: Renders project data correctly
- [ ] Test: Shows loading state
- [ ] Test: Shows error state for missing project
- [ ] Test: Back link navigates correctly
- [ ] 90%+ code coverage for new component

**Testing:**
```typescript
describe('ProjectDetailPage', () => {
  it('renders project data', async () => {
    // Mock fetch
    // Render component
    // Assert project name, dates visible
  });
  
  it('shows loading state', () => {
    // Render with pending promise
    // Assert loading indicator visible
  });
  
  it('shows error for invalid project', () => {
    // Mock 404 response
    // Assert error message visible
  });
});
```

---

#### Story 7: Add E2E Tests
**Task**: Test full navigation flow  
**Time**: 2-3 hours

**Acceptance Criteria:**
- [ ] Test: Navigate from list to detail (click card)
- [ ] Test: Navigate back from detail to list
- [ ] Test: Direct URL navigation to detail page
- [ ] Test: 404 handling for invalid project ID
- [ ] Test: Delete button doesn't trigger navigation

**Testing:**
```typescript
test('navigate to project detail by clicking card', async ({ page }) => {
  await page.goto('/projects');
  await page.click('[data-testid="project-card-1"]'); // Click card, not delete button
  await expect(page).toHaveURL(/\/projects\/\d+/);
  await expect(page.locator('h1')).toHaveText('Test Project');
});

test('navigate back to list', async ({ page }) => {
  await page.goto('/projects/1');
  await page.click('text=Back to Projects');
  await expect(page).toHaveURL('/projects');
});

test('delete button does not navigate', async ({ page }) => {
  await page.goto('/projects');
  await page.click('[data-testid="delete-button-1"]');
  // Should stay on projects list, not navigate
  await expect(page).toHaveURL('/projects');
});

test('shows 404 for invalid project', async ({ page }) => {
  await page.goto('/projects/99999');
  await expect(page.locator('h1')).toContainText('Not Found');
  await expect(page.locator('a[href="/projects"]')).toBeVisible();
});
```

---

### Definition of Done

**Epic is complete when:**
- [ ] All 7 stories completed
- [ ] User can click project → See detail page
- [ ] User can click back → Return to list
- [ ] Page is styled consistently
- [ ] Unit tests pass (90%+ coverage)
- [ ] E2E tests pass
- [ ] Code reviewed
- [ ] Deployed to dev/staging
- [ ] Manual QA passed

---

### What This Enables (Future)

Once this foundation is in place, we can easily add:
- ✅ Edit project name
- ✅ Add video title field
- ✅ Add description field
- ✅ More complex features (templates, AI, etc.)

But for now: **Just navigation. Keep it simple.**

---

### Epic 1: Manual Title Management (Phase 0 - MVP)
**Goal**: Manually add, edit, and manage video titles without AI
**Duration**: 1-2 weeks
**Value**: Core title workflow, proves data model

**Stories:**
- Add `video_title`, `video_description`, `video_script` fields to Project model
- Create database migration
- Create `TitleCandidate` model and migration
- Build title candidates CRUD API endpoints
- Create "Title Workshop" page/component
  - Input field for new title
  - List of title candidates
  - Character counter (YouTube title limit: 100 chars)
  - Edit, delete, select actions
- Mark one title as "selected" (becomes project.video_title)
- Add navigation from Project Detail → Title Workshop
- Unit + integration tests

**Success Criteria:**
- User can add multiple title ideas
- User can edit existing titles
- User can select one as the "active" title
- Selected title shows on Project Detail page
- Title candidates persist in database

---

### Epic 2: Title Templates System (Phase 1)
**Goal**: Create and use templates for structured title creation
**Duration**: 1-2 weeks
**Value**: Consistency, faster title creation, foundation for AI

**Stories:**
- Create `TitleTemplate` model with competitor examples JSON field
- Create `ProjectTemplate` link table
- Build template CRUD API endpoints
- Design template library UI (list, create, edit, delete)
- Implement variable parsing logic (find `[placeholders]`)
- Add "Use Template" flow in Title Workshop:
  1. Select template
  2. Fill in variables (e.g., `[technology]` → "AI")
  3. Add context description text
  4. Create title candidate from template
- Display competitor examples when viewing template
- Add/edit/remove competitor examples on template
- Seed database with 5-10 initial templates
- Track template usage (analytics)

**Success Criteria:**
- User can browse template library
- User can create custom templates with variables
- User can apply template to generate title candidate
- User can add competitor example titles to templates
- Templates display examples with view counts

---

### Epic 3: AI Title Generation - Basic (Phase 2)
**Goal**: Generate title variations using AI
**Duration**: 1-2 weeks
**Value**: Speed up ideation, leverage AI creativity

**Stories:**
- Choose AI service (OpenAI GPT-4, Claude, etc.)
- Set up API keys and client library
- Design prompt engineering strategy:
  - Use project context
  - Apply template if selected
  - Reference competitor examples
- Create `/title-candidates/generate` API endpoint
- Build "Generate Ideas" button in Title Workshop
- Show loading state during generation
- Display AI-generated titles as candidates
- Allow user to regenerate or tweak prompts
- Add error handling and fallbacks
- Track AI usage and costs
- Unit tests for prompt building logic

**Success Criteria:**
- User clicks "Generate Ideas" → AI creates 3-5 title options
- Titles saved as candidates with source='ai_generated'
- User can accept, edit, or regenerate
- System handles API errors gracefully

---

### Epic 4: YouTube Competitive Analysis (Phase 3)
**Goal**: Analyze competitor videos for viral patterns and SEO
**Duration**: 2-3 weeks
**Value**: Data-driven title optimization, viral potential scoring

**Stories:**
- Integrate YouTube Data API v3
- Create `/youtube/video-details` endpoint
- Allow user to add competitor video URLs to project
- Fetch and display competitor metadata:
  - Title, views, likes, comments
  - Publish date, engagement rate
  - Channel info
- Analyze title patterns (length, keywords, style)
- Calculate SEO score for title candidates
- Calculate viral potential score (AI-based)
- Show competitive comparison in Title Workshop
- Provide improvement suggestions
- Store competitor data for future reference

**Success Criteria:**
- User pastes YouTube URL → System fetches metadata
- Title candidates show SEO score (0-100)
- Title candidates show viral score (0-100)
- System suggests improvements ("Add year", "Use numbers", etc.)
- User can see what makes competitor titles successful

---

### Epic 5: Advanced AI Features (Phase 3+)
**Goal**: Smart title optimization based on competitive research
**Duration**: 2-3 weeks
**Value**: Maximum viral potential, data-driven decisions

**Stories:**
- AI analysis of competitor title patterns
- Generate titles specifically optimized for SEO
- A/B testing recommendations
- Trending topic detection
- Keyword optimization
- Clickbait detection and scoring
- Title performance prediction
- Historical performance tracking

**Success Criteria:**
- AI generates titles using competitor patterns
- System recommends best title based on multiple factors
- User sees prediction of title performance

---

### Epic 6: Description & Script Workshops (Future)
**Goal**: Apply same pattern to description and script creation
**Duration**: 3-4 weeks
**Value**: Complete video content creation suite

**Stories:**
- Description Workshop page
- Script Builder page
- Templates for descriptions and scripts
- AI generation for both
- SEO optimization for descriptions
- Timestamp suggestions for descriptions

---

## 🚀 REVISED Recommended Sequencing

### ✅ Phase 0: Manual Foundation (Weeks 1-3)
**Goal**: Manual title management, no AI

1. **Epic 0**: Project Detail Navigation (1 week)
2. **Epic 1**: Manual Title Management (1-2 weeks)

**Deliverable**: User can navigate to project, add/edit/select titles manually

---

### Phase 1: Templates (Weeks 4-5)
**Goal**: Structured title creation

3. **Epic 2**: Title Templates System (1-2 weeks)

**Deliverable**: User can use templates with competitor examples

---

### Phase 2: AI Generation (Weeks 6-7)
**Goal**: AI-powered title creation

4. **Epic 3**: AI Title Generation - Basic (1-2 weeks)

**Deliverable**: AI generates title ideas based on context and templates

---

### Phase 3: Competitive Intelligence (Weeks 8-11)
**Goal**: YouTube analytics and viral optimization

5. **Epic 4**: YouTube Competitive Analysis (2-3 weeks)
6. **Epic 5**: Advanced AI Features (2-3 weeks)

**Deliverable**: Data-driven viral title optimization

---

### Phase 4: Expand Content Types (Weeks 12-15)
**Goal**: Description and script creation

7. **Epic 6**: Description & Script Workshops (3-4 weeks)

**Deliverable**: Complete video content creation suite

---

## 🧪 Technical Considerations

### Backend Stack
- **Current**: FastAPI + SQLAlchemy + Alembic
- **New Additions Needed**:
  - AI client library (openai, anthropic, etc.)
  - Template parsing library (Jinja2? Custom?)
  - YouTube API client (optional, for competitor analysis)

### Frontend Stack
- **Current**: Next.js + React + TypeScript
- **New Components Needed**:
  - Title input with live character count
  - Title comparison grid
  - AI generation loading states
  - Template selector dropdown
  - Rating star component

### Database Migrations
- **New Tables**: Video, TitleOption, TitleTemplate, CompetitorTitle (optional)
- **Migration Strategy**: Incremental, test on dev first
- **Data Seeding**: Initial template library

### Testing Strategy
- **Unit Tests**: Template parsing, AI prompt building
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Full title creation workflow
- **Manual QA**: AI generation quality, UX flow

---

## 💭 Additional Ideas (Future)

### Description & Script Features
- Apply same pattern: Hub → Description Workshop, Script Builder
- AI-generated descriptions based on title
- Script outline generator
- Transcript editor

### Analytics & Insights
- Track which titles perform best
- A/B testing framework
- SEO score for titles
- Thumbnail suggestions based on title

### Collaboration Features
- Share projects with team members
- Comment on title options
- Version history for titles

### Export & Publishing
- Export to YouTube directly
- Schedule publishing
- Cross-platform optimization (YouTube, TikTok, Instagram)

---

## 📊 Success Metrics

### User Value
- Time saved generating titles
- Title performance (CTR improvement)
- User satisfaction with AI suggestions

### Technical Health
- API response times < 200ms (non-AI)
- AI generation time < 5 seconds
- Test coverage > 90%
- Zero data loss incidents

### Product Growth
- Projects created per user
- Titles generated per project
- Template usage rate
- AI generation adoption rate

---

## Next Steps (When Ready)

1. **Review & Discuss**: Talk through these options
2. **Choose Navigation Pattern**: Hub & Spoke vs. other
3. **Finalize Data Model**: Video entity design
4. **Pick AI Service**: OpenAI vs. alternatives
5. **Create Epic 1 Issues**: Detailed breakdown
6. **Update Project Roadmap**: Add timeline

---

**Remember**: This is just brainstorming. No implementation yet! ✋
