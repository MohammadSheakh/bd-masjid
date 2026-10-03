---
id: F-008
name: Mosque Attendance Tracking
phase: 1
status: completed

depends_on:
  - F-001
  - F-002
  - F-004

blocks: []

parallel_with:
  - F-007

source:
  - 01-PRD-PRODUCTION.md#attendance-tracking
  - 03-DATA-API-CONTRACTS.md#attendance-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#j-attendance-tracking
---

# Feature Specification: Mosque Attendance Tracking

## 1. Overview
The Attendance Tracking feature allows community members to declare their enduring attendance affiliation with a mosque (regular worshippers vs occasional attendees). This is a **one-time declaration** rather than a daily recurring action, providing crowd-sourced vitality indicators without compromising individual user privacy.

## 2. Business Invariants
1. **Unique User-Mosque Pair**: A single user can have at most one attendance status per mosque (`@@unique([userId, mosqueId])`).
2. **One-Time Affiliation Selection**: A person selects one option (`REGULAR` or `OCCASIONAL`). Re-selecting the active status toggles off (`NONE`), or clicking the alternate option switches the affiliation directly.
3. **Dual Count Transparency**: Every mosque surface (`MosqueCard`, `MosqueDetailModal`, `/mosques/[id]`) MUST display both `regularCount` and `occasionalCount` metrics simultaneously (e.g. `X regular • Y occasional`).
4. **Idempotent Mutations**: Multiple identical attendance requests must yield the same result without inflating counters.
5. **Privacy Exposure Guard**: Public endpoints must expose only aggregated counts (`regularCount`, `occasionalCount`), never listing individual user identities.
6. **Server-Derived User**: The `userId` is obtained strictly from the authenticated JWT session with local storage fallback for visitors.

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
- [x] Backend: Attach `attendanceSummary` in `findNearby` and `findAll` batch queries
- [x] Frontend: Display dual counts (`regularCount` and `occasionalCount`) on `MosqueCard`
- [x] Frontend: Display dual counts and one-time declaration guidance in `MosqueDetailModal`
- [x] Frontend: Display dual counts on standalone mosque profile `/mosques/[id]`

---

## 6. Implementation Slices & Proof of Completion

### TK-ATTN-01: Attendance Schema & Idempotent Service
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Implement the database model, unique constraint, and NestJS service for tracking attendance idempotently with aggregation.
- **Acceptance Criteria**:
  - [x] Model `UserMosqueAttendance` configured with `@@unique([userId, mosqueId])`.
  - [x] Service method `setAttendance` uses Prisma `upsert` guaranteeing no duplicates under race conditions.
  - [x] Service method `getAttendanceStats` returns counts grouped by `status` (`REGULAR`, `OCCASIONAL`).
  - [x] Unit tests cover idempotency, concurrent calls, and stats aggregation (`attendance.service.spec.ts`).
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema.prisma`
  - Service: `backend-nest-prisma/src/features/attendance/attendance.service.ts`
  - Controller: `backend-nest-prisma/src/features/attendance/attendance.controller.ts`
  - Tests: `backend-nest-prisma/src/features/attendance/attendance.service.spec.ts`

### TK-ATTN-02: Attendance UI Toggle & Aggregate Badge
- **Status**: `[x] Completed` | **Priority**: Medium
- **Description**: Provide the user interface inside the Mosque Detail modal and standalone profile page allowing musallis to toggle their attendance status and view total regular/occasional attendees.
- **Acceptance Criteria**:
  - [x] Toggle controls for "I pray regularly here" vs "I pray occasionally here".
  - [x] Unauthenticated users prompted to sign in before setting attendance.
  - [x] Live aggregate attendee count badge displayed on the mosque card and profile.
  - [x] Optimistic UI update with rollback on error.
- **Implementation Files**:
  - Frontend Component: `frontend/src/components/MosqueDetailModal.tsx`
  - Mosque Page: `frontend/src/app/mosques/[id]/page.tsx`
