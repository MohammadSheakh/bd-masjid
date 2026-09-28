# TK-VERF-02: Admin Moderation Dashboard View

## Spec
Parent Spec: [mosque-verification.md](../mosque-verification.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Build the Next.js admin interface (`/admin`) presenting pending mosque submissions, verification actions, suggestion reviews, and system metrics.

## Acceptance Criteria
- [x] Admin dashboard page at `app/admin/page.tsx`.
- [x] Pending mosques queue table with name, location coordinates, creator, and action buttons.
- [x] "Verify" action triggers approval and updates list immediately.
- [x] "Reject" action opens prompt for rejection reasoning.
- [x] Reports and suggestions tab for moderating community reports.

## Implementation Files
- Frontend Admin Page: `frontend/src/app/admin/page.tsx`
