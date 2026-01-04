# Templates Page Refactoring Opportunities

## Tracking Issue #187 Follow-up Refactoring

Status: In Progress
Priority: Nice-to-have improvements for code maintainability

---

## High Priority Refactorings

### 1. Extract Modal Components ⏳ IN PROGRESS
**File:** `frontend/app/templates/page.tsx`

Extract the three modal dialogs (create, edit, delete) into separate, reusable components.

**Current State:** ~100+ lines of modal JSX inlined in main component
**Benefit:** Better maintainability, reduced file size, reusable modal pattern
**Components to Create:**
- `TemplateFormModal.tsx` - Wrapper for create/edit forms
- `TemplateDeleteModal.tsx` - Delete confirmation dialog
- `Modal.tsx` - Base reusable modal wrapper

**Implementation Plan:**
1. Create base `Modal.tsx` component with common styling/behavior
2. Extract create/edit modal to `TemplateFormModal.tsx`
3. Extract delete modal to `TemplateDeleteModal.tsx`
4. Update page.tsx to use new components
5. Update tests to mock new components

---

### 2. Extract Reusable Modal Wrapper
**File:** `frontend/app/components/Modal.tsx` (new)

Create a generic `<Modal>` component for consistent styling and behavior across all modals.

**Current Pattern (repeated):**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" ...>
  <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl" ...>
```

**Benefit:** DRY principle, consistent backdrop behavior, easier to customize

---

### 3. Create useModalKeyboardHandler Hook
**File:** `frontend/app/hooks/useModalKeyboardHandler.ts` (new)

Delete dialog has Escape key handling in useEffect. Standardize across all modals.

**Benefit:** Consistent escape-key behavior, reusable logic

---

### 4. Consolidate Filter Button Component
**File:** `frontend/app/templates/page.tsx` (refactor section)

Three filter buttons (All, Title, Description) are nearly identical (~10 lines each).

**Options:**
- Extract to `<FilterButton>` component
- Use map-based pattern with configuration array

**Benefit:** Reduce repetition, easier to maintain filter logic

---

## Medium Priority Refactorings

### 5. Extract Button Styling Utility
**Files:** Multiple

Button styling repeated across:
- Create Template button (header)
- Filter buttons (toolbar)
- Edit/Delete buttons (template cards)
- Modal action buttons (dialogs)

**Solution:** Create button variant components or utility class generators

**Benefit:** Consistent styling, easier theme updates

---

### 6. Move Utility Functions to Shared Module
**Current Location:** Bottom of `frontend/app/templates/page.tsx`
**New Location:** `frontend/app/utils/template.ts` (create)

Functions to move:
- `normalizeTemplateFromApi()`
- `calculateTemplateCounts()`
- `filterTemplatesByType()`
- `formatDate()`

**Benefit:** Reusable across other template-related pages, easier testing

---

## Low Priority Refactorings

### 7. Test File Refactoring
**File:** `frontend/app/templates/__tests__/page.test.tsx` (1,074 lines)

**Opportunities:**
- Create `__tests__/fixtures.ts` for shared mock data
- Extract common test setup/teardown patterns
- Create helpers for repetitive button click patterns
- Reduce duplication in mock data creation

**Benefit:** More maintainable tests, clearer test intent

---

## Implementation Progress

- [x] #1: Extract Modal Components ✅ COMPLETED
- [x] #2: Reusable Modal Wrapper ✅ COMPLETED
- [x] #3: useModalKeyboardHandler Hook ✅ COMPLETED
- [ ] #4: Filter Button Component
- [ ] #5: Button Styling Utility
- [ ] #6: Shared Utility Functions
- [ ] #7: Test File Refactoring

---

## Notes

- Started: January 3, 2026
- Related Issue: #187 (Templates CRUD UI)
- Branch: `feature/issue-187-templates-crud-ui`
- This refactoring maintains 100% test coverage and doesn't change functionality
