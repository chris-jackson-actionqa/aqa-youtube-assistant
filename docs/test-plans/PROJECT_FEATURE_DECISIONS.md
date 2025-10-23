# Project Feature - Requirements Clarifications & Decisions

**Date**: October 22, 2025  
**Status**: All questions resolved ✅  
**Related Document**: `PROJECT_FEATURE_TEST_PLAN.md`

---

## Summary

This document captures all requirement clarifications and architectural decisions made for the Project Management feature. These decisions inform implementation, testing, and future development.

---

## High Priority Decisions

### 1. Status Transition Validation ✅
**Decision**: Free transitions allowed - no enforcement

**Details**:
- Users can move to any status at any time
- No enforcement of progression (planned → in_progress → completed)
- Valid statuses: `planned`, `in_progress`, `completed`, `archived`

**Impact**:
- Simpler implementation
- Greater user flexibility
- Test all status combinations

---

### 2. Project Name Whitespace Handling ✅
**Decision**: Trim automatically - strip leading/trailing whitespace before validation and storage

**Details**:
- Automatically trim whitespace on input
- Applied before duplicate check
- Applied before database storage
- Prevents confusing near-duplicates (" Project" vs "Project")

**Impact**:
- Better user experience
- Cleaner data
- Prevents unintentional duplicates

**Implementation Notes**:
- Apply `.strip()` in Pydantic validator or backend processing
- Apply `.trim()` in frontend form submission

---

### 3. Pagination ✅
**Decision**: Keep returning all projects for MVP (acceptable for current scale of ~52 projects/year). Add pagination as future enhancement when needed.

**Details**:
- Current rate: ~1 video/week = ~52 projects/year
- "Return all" approach acceptable for years 1-2
- Add pagination when approaching 100+ projects or performance degrades

**Impact**:
- Simpler initial implementation
- Acceptable performance for foreseeable future
- Document as technical debt for later

**Future Consideration**:
- Implement pagination when reaching ~100 projects
- Consider page size of 25-50 items

---

### 4. Concurrent Access ✅
**Decision**: Single-user application. Accept race condition risk as low impact. Add database UNIQUE constraint on project name (case-insensitive) as defense-in-depth safety net.

**Details**:
- Only one user (you) will use the app
- Race conditions extremely unlikely (single user)
- Add DB UNIQUE constraint as best practice
- No need for complex locking mechanisms

**Impact**:
- Simplified implementation
- No multi-user considerations needed
- DB constraint provides safety net

**Implementation Notes**:
- Add UNIQUE constraint to `projects.name` column
- Implement case-insensitive constraint (e.g., using functional index or CHECK constraint)
- Handle DB constraint violation gracefully in API (translate to 400 error)

---

### 5. Delete Recovery ✅
**Decision**: Hard delete acceptable. Confirmation modal provides sufficient safety.

**Details**:
- Permanent deletion (no soft delete)
- Frontend confirmation modal prevents accidental deletion
- No recovery mechanism needed
- No "trash" or "archive" for deleted projects

**Impact**:
- Simpler data model
- No cleanup of soft-deleted records
- Lower storage overhead

**Note**: 
- "archived" status exists for projects you want to keep but mark as done
- Delete is for projects you truly don't want anymore

---

## Medium Priority Decisions

### 6. Description Max Length ✅
**Decision**: Cap at 2,000 characters (field likely to be removed in future).

**Details**:
- Maximum 2,000 characters
- Field is rarely/never used currently
- May be removed in future iteration

**Impact**:
- Prevents database issues
- Prevents UI display issues
- Minimal impact since field not actively used

**Implementation Notes**:
- Add `max_length=2000` to Pydantic schema
- Add `maxLength={2000}` to frontend form input
- Consider removing field in future refactor

---

### 7. Error Message Detail ✅
**Decision**: Full technical details acceptable for personal app. Helpful for debugging.

**Details**:
- Show detailed error messages (stack traces, SQL errors, etc.)
- No need to sanitize for security (single user = developer)
- Aids in debugging and development

**Impact**:
- Faster debugging
- Better development experience
- No sanitization overhead

**Note**: 
- If app becomes multi-user in future, revisit this decision
- Current FastAPI default error handling is acceptable

---

### 8. Browser Support ✅
**Decision**: Firefox only (personal use). No cross-browser testing needed.

**Details**:
- Primary browser: Firefox
- No need to test Chrome, Safari, Edge, IE11
- No cross-browser compatibility concerns

**Impact**:
- Simplified testing
- Can use Firefox-specific features if needed
- Reduced E2E test execution time

**Implementation Notes**:
- Configure Playwright to test Firefox only
- No need for browser matrix in CI

---

### 9. Mobile Requirements ✅
**Decision**: Desktop only - no mobile support needed.

**Details**:
- Desktop-only application
- No mobile/tablet support required
- No responsive design needed

**Impact**:
- Simplified UI development
- Fixed layout assumptions
- Desktop-optimized workflows

**Implementation Notes**:
- Can use fixed layouts
- No need for responsive breakpoints
- No mobile testing required

---

### 10. Performance with Scale ✅
**Decision**: ~1 video/week = ~52 projects/year. Current "return all" approach acceptable. Test with up to 100-200 projects for future-proofing.

**Details**:
- Expected scale: 52 projects/year
- After 2 years: ~100 projects
- Current architecture acceptable for 3-5 years

**Impact**:
- No immediate performance optimizations needed
- Test with larger datasets to ensure scalability

**Testing Notes**:
- Performance tests should include 100-200 projects
- Monitor response times as project count grows

---

## Low Priority Decisions

### 11. Search/Filter ✅
**Decision**: Wait until needed - avoid premature design.

**Details**:
- No search or filter functionality initially
- Implement when project count makes browsing difficult
- Apply YAGNI principle

**Future Consideration**:
- Consider when approaching 100+ projects
- Simple text search on name field likely sufficient

---

### 12. Bulk Operations ✅
**Decision**: Not needed now - one-at-a-time sufficient for current scale.

**Details**:
- No multi-select or batch operations
- One project at a time is acceptable
- Simplifies UI and implementation

**Future Consideration**:
- Revisit if workflow becomes tedious

---

### 13. Project Templates ✅
**Decision**: Not needed - keep it simple.

**Details**:
- No predefined templates
- No project types or categories
- Simple, flat structure

---

### 14. Collaboration ✅
**Decision**: No - single-user app only.

**Details**:
- No multi-user features
- No sharing or permissions
- No real-time collaboration

**Note**: 
- Major architectural change if requirements change in future

---

### 15. Audit Log ✅
**Decision**: No - not needed for single-user app. Current timestamps sufficient.

**Details**:
- Only track `created_at` and `updated_at`
- No detailed change history
- No user attribution (single user)

---

## Additional Decisions

### 16. Empty String Handling in Description ✅
**Decision**: Convert empty strings to null for consistency.

**Details**:
- Empty strings (`""`) converted to `null`
- Single representation of "no description"
- Simplifies queries and display logic

**Impact**:
- Consistent data model
- Simpler null checks
- No ambiguity between `null` and `""`

**Implementation Notes**:
- Add Pydantic validator to convert empty strings to null
- Update frontend to send null for empty descriptions
- Update tests to verify null conversion

---

## Implementation Checklist

Based on decisions above, the following implementation changes are needed:

### Backend Changes:

- [ ] Add whitespace trimming to project name (Pydantic validator)
- [ ] Add UNIQUE constraint to `projects.name` (database migration)
- [ ] Add max_length=2000 validation to description field
- [ ] Add empty string → null conversion for description (Pydantic validator)
- [ ] Verify case-insensitive duplicate check works with trimmed names
- [ ] Add handling for DB constraint violation (translate to 400 error)

### Frontend Changes:

- [ ] Add whitespace trimming to project name input
- [ ] Add maxLength={2000} to description textarea
- [ ] Convert empty description to null before API call
- [ ] Update error handling for trimmed name duplicates

### Testing Changes:

- [ ] Update unit tests for whitespace trimming
- [ ] Add tests for description max length (2000 chars)
- [ ] Add tests for empty string → null conversion
- [ ] Add tests for DB UNIQUE constraint enforcement
- [ ] Update E2E tests for Firefox only
- [ ] Remove mobile/responsive tests
- [ ] Remove cross-browser tests

### Documentation Updates:

- [ ] Update API documentation with field constraints
- [ ] Document trimming behavior
- [ ] Document description max length
- [ ] Update README with browser requirements (Firefox)
- [ ] Update README with desktop-only note

---

## Technical Debt / Future Enhancements

Document items for future consideration:

1. **Pagination**: Implement when approaching 100+ projects
2. **Search/Filter**: Add when browsing becomes difficult
3. **Remove Description Field**: Rarely used, consider removing entirely
4. **Bulk Operations**: Consider if workflow becomes tedious
5. **Database Migration**: SQLite → PostgreSQL if app scales or needs multi-user

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-22 | 1.0 | Initial decisions documented | Test Planning Agent |

---

## Related Documents

- `PROJECT_FEATURE_TEST_PLAN.md` - Comprehensive test plan
- `/docs/PROJECT_MANAGEMENT.md` - Feature specification
- `/docs/adr/ADR-001-project-based-organization.md` - Architecture decision
- `/.github/copilot-instructions.md` - Project conventions
