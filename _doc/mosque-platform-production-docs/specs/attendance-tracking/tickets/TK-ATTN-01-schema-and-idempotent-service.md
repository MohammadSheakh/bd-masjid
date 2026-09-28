# TK-ATTN-01: Attendance Schema & Idempotent Service

## Spec
Parent Spec: [attendance-tracking.md](../attendance-tracking.md)

## Status
**Completed** `[x]`

## Priority
High

---

## Description
Implement the database model, unique constraint, and NestJS service for tracking attendance idempotently with aggregation.

## Acceptance Criteria
- [x] Model `UserMosqueAttendance` configured with `@@unique([userId, mosqueId])`.
- [x] Service method `setAttendance` uses Prisma `upsert` guaranteeing no duplicates under race conditions.
- [x] Service method `getAttendanceStats` returns counts grouped by `status` (`REGULAR`, `OCCASIONAL`).
- [x] Unit tests cover idempotency, concurrent calls, and stats aggregation (`attendance.service.spec.ts`).

## Implementation Files
- Schema: `backend-nest-prisma/prisma/schema.prisma`
- Service: `backend-nest-prisma/src/features/attendance/attendance.service.ts`
- Controller: `backend-nest-prisma/src/features/attendance/attendance.controller.ts`
- Tests: `backend-nest-prisma/src/features/attendance/attendance.service.spec.ts`
