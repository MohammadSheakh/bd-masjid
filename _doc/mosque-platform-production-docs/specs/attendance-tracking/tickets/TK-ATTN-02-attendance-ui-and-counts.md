# TK-ATTN-02: Attendance UI Toggle & Aggregate Badge

## Spec
Parent Spec: [attendance-tracking.md](../attendance-tracking.md)

## Status
**Completed** `[x]`

## Priority
Medium

---

## Description
Provide the user interface inside the Mosque Detail modal and standalone profile page allowing musallis to toggle their attendance status and view total regular/occasional attendees.

## Acceptance Criteria
- [x] Toggle controls for "I pray regularly here" vs "I pray occasionally here".
- [x] Unauthenticated users prompted to sign in before setting attendance.
- [x] Live aggregate attendee count badge displayed on the mosque card and profile.
- [x] Optimistic UI update with rollback on error.

## Implementation Files
- Frontend Component: `frontend/src/components/MosqueDetailModal.tsx`
- Mosque Page: `frontend/src/app/mosques/[id]/page.tsx`
