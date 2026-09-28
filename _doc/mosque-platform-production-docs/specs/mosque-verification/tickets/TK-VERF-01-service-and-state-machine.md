# TK-VERF-01: Verification Service & State Machine

## Spec
Parent Spec: [mosque-verification.md](../mosque-verification.md)

## Status
**Completed** `[x]`

## Priority
Critical

---

## Description
Implement the business logic and API endpoints for moderating and verifying submitted mosques, including role enforcement, transition validation, and audit recording.

## Acceptance Criteria
- [x] Endpoints `GET /pending`, `POST /:mosqueId/verify`, `POST /:mosqueId/reject`.
- [x] Restrict access to `admin` and `moderator` roles using `PermissionsGuard`.
- [x] Transition updates `verificationStatus`, `verifiedById`, `verifiedAt`, and `verificationNotes`.
- [x] Creates an audit log entry in `AuditLog` table.
- [x] Idempotent handling if already verified or rejected.

## Implementation Files
- Controller: `backend-nest-prisma/src/features/mosque-verification/mosque-verification.controller.ts`
- Service: `backend-nest-prisma/src/features/mosque-verification/mosque-verification.service.ts`
- Tests: `backend-nest-prisma/src/features/mosque-verification/mosque-verification.service.spec.ts`
