# TK-SUGG-01: Suggestions & Reports Persistence API

## Spec
Parent Spec: [suggestions-reports.md](../suggestions-reports.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Build the backend data models, DTOs, and endpoints for accepting crowdsourced suggestions and issue reports with sliding-window rate limiting.

## Acceptance Criteria
- [x] Prisma models `MosqueSuggestion` and `MosqueReport` defined with relational links to `Mosque` and `User`.
- [x] Endpoints `POST /api/v1/mosques/:id/suggestions` and `POST /api/v1/mosques/:id/reports` accepting validated DTOs.
- [x] Rate limiting applied to prevent submission flooding.
- [x] Moderation endpoints `GET /api/v1/admin/suggestions`, `PATCH /api/v1/admin/suggestions/:id/status`, `GET /api/v1/admin/reports`, and `PATCH /api/v1/admin/reports/:id/status` restricted to moderator/admin.
- [x] Unit tests cover submission and status transitions (`suggestions.service.spec.ts`).

## Implementation Files
- Schema: `backend-nest-prisma/prisma/schema.prisma`
- Service: `backend-nest-prisma/src/features/suggestions/suggestions.service.ts`
- Controller: `backend-nest-prisma/src/features/suggestions/suggestions.controller.ts`
- Tests: `backend-nest-prisma/src/features/suggestions/suggestions.service.spec.ts`
