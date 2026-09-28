# TK-MOSQ-03: Mosque Profile Endpoint & Standalone Page

## Spec
Parent Spec: [mosques-registry.md](../mosques-registry.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Provide a public endpoint and Next.js standalone page for viewing any mosque by ID, including its operational status, facilities, current prayer schedule, and attendance stats. The page must function directly via URL without dependencies on the interactive map.

## Acceptance Criteria
- [x] Endpoint `GET /api/v1/mosques/:id` returns comprehensive mosque details, facilities, current prayer schedule, and attendance counts.
- [x] Explicit response projection ensures sensitive internal fields are omitted.
- [x] Next.js route `/mosques/[id]` renders server-side or dynamic profile.
- [x] Shows operational badges (`OPEN`, `TEMPORARILY_CLOSED`), verification badge (`VERIFIED`, `UNVERIFIED`).
- [x] Unknown attributes gracefully displayed as "Not specified".
- [x] Works seamlessly on direct link / page refresh.

## Implementation Files
- API Endpoint: `backend-nest-prisma/src/features/mosques/mosques.controller.ts`
- Frontend Page: `frontend/src/app/mosques/[id]/page.tsx`
- Modal View: `frontend/src/components/MosqueDetailModal.tsx`
