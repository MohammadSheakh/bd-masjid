# TK-COMM-01: Community Backend Service & Schemas

## Spec
Parent Spec: [community-engagement.md](../community-engagement.md)

## Status
**Completed** `[x]`

## Priority
Medium

---

## Description
Develop the backend models, services, and endpoints for mosque community features: staff rosters, role claims, announcements, donation methods, and bookmarks.

## Acceptance Criteria
- [x] Models `MosqueStaff`, `MosqueRoleClaim`, `MosqueAnnouncement`, `MosqueDonationMethod`, `MosqueBookmark`.
- [x] Endpoints for querying and mutating community entities under `/api/v1/community` (and `/api/v1/mosques/:id/...` nested aliases).
- [x] Role claims submit evidence string and enter `OPEN` status.
- [x] Unit tests cover claims, bookmarks, and announcements (`community.service.spec.ts`).

## Implementation Files
- Schema: `backend-nest-prisma/prisma/schema.prisma`
- Service: `backend-nest-prisma/src/features/community/community.service.ts`
- Controller: `backend-nest-prisma/src/features/community/community.controller.ts`
- Tests: `backend-nest-prisma/src/features/community/community.service.spec.ts`
