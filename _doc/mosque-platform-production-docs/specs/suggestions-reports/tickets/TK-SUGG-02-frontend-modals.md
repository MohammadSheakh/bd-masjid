# TK-SUGG-02: Suggestion & Report Frontend Modals

## Spec
Parent Spec: [suggestions-reports.md](../suggestions-reports.md)

## Status
**Completed** `[x]`

## Priority
Medium

---

## Description
Develop UI dialogs allowing users to suggest new prayer times or report issues directly from any mosque card or profile page.

## Acceptance Criteria
- [x] Component `SuggestionModal.tsx` provides inputs for updating prayer times with 24h format validation.
- [x] Component `ReportModal.tsx` provides category radio buttons (wrong location, duplicate, closed) and comments.
- [x] Feedback toast displayed upon successful submission.
- [x] Responsive layout on both mobile viewports and desktop.

## Implementation Files
- Components: `frontend/src/components/SuggestionModal.tsx`, `frontend/src/components/ReportModal.tsx`
- Parent Modals: `frontend/src/components/MosqueDetailModal.tsx`
