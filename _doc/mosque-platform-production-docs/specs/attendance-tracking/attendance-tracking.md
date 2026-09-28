# Feature Specification: Mosque Attendance Tracking

## 1. Overview
The Attendance Tracking feature allows registered community members to mark their attendance habits at a mosque (regular vs occasional), providing crowd-sourced vitality indicators without compromising individual user privacy.

## 2. Business Invariants
1. **Unique User-Mosque Pair**: A single user can have at most one attendance status per mosque (`@@unique([userId, mosqueId])`).
2. **Idempotent Mutations**: Multiple identical attendance requests must yield the same result without inflating counters.
3. **Privacy Exposure Guard**: Public endpoints must expose only aggregated counts (`regularCount`, `occasionalCount`), never listing individual user identities.
4. **Server-Derived User**: The `userId` is obtained strictly from the authenticated JWT session.

## 3. Data Model Reference (`UserMosqueAttendance`)
- `id`: CUID
- `userId`: foreign key to `User`
- `mosqueId`: foreign key to `Mosque`
- `status`: `REGULAR` | `OCCASIONAL` | `NONE`
- `createdAt`, `updatedAt`: DateTime

## 4. REST API Contracts
- `GET /api/v1/attendance/:mosqueId` — Get attendance aggregates and caller's personal status
- `PUT /api/v1/attendance/:mosqueId` — Set/update caller's attendance status (authenticated)
- `DELETE /api/v1/attendance/:mosqueId` — Reset caller's attendance status (authenticated)

## 5. Extracted Implementation Checklist
- [x] Unique composite constraint `(userId, mosqueId)` in schema
- [x] Idempotent upsert via `PUT /api/v1/attendance/:mosqueId`
- [x] Deletion/reset behavior via `DELETE /api/v1/attendance/:mosqueId`
- [x] Aggregated status counts calculated accurately
- [x] Privacy review: individual attendee list not exposed publicly
- [x] Concurrency and idempotency unit tests (`attendance.service.spec.ts`)
- [x] Mosque detail view displaying verified attendance counts

## 6. Associated Tickets
- [TK-ATTN-01: Attendance Schema & Idempotent Service](tickets/TK-ATTN-01-schema-and-idempotent-service.md)
- [TK-ATTN-02: Attendance UI Toggle & Aggregate Badge](tickets/TK-ATTN-02-attendance-ui-and-counts.md)
