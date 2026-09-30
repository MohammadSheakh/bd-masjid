---
id: F-018
name: Module-Level Test Directory Architecture & Production Controller Unit Test Suite
phase: 1
status: completed

depends_on:
  - F-001
  - F-002
  - F-003
  - F-004
  - F-005
  - F-006
  - F-007
  - F-008
  - F-010
  - F-021
  - F-022
  - F-030
  - F-031

blocks: []

parallel_with: []

source:
  - 05-TESTING-STRATEGY.md#unit-testing
  - 06-IMPLEMENTATION-CHECKLIST.md#production-testing-gates
  - 08-PRODUCTION-ENGINEERING-STANDARD.md#testing-standard
---

# Feature Specification: Module-Level Test Directory Architecture & Production Controller Unit Test Suite (F-018)

## 1. Overview & Architecture Invariants

Prior to **F-018**, backend unit tests in `backend-nest-prisma/src/features/` were co-located directly beside service files (e.g. `src/features/mosques/mosques.service.spec.ts`), while controllers had minimal or missing unit test coverage.

**F-018** establishes an immutable architectural directory structure and comprehensive unit test suite:
1. **Module Test Folder Standard**: Every feature module in `backend-nest-prisma/src/features/<feature>/` isolates its unit tests within a dedicated `test/` directory (e.g. `src/features/<feature>/test/<feature>.service.spec.ts` and `src/features/<feature>/test/<feature>.controller.spec.ts`).
2. **Controller Unit Test Coverage**: Every core feature controller is accompanied by a dedicated production-grade unit test verifying:
   - Execution paths with expected HTTP responses
   - Parameter & DTO validation / forwarding to service layer
   - Actor context extraction (`req.user` / `@CurrentUser()`)
   - Proper exception handling and error propagation
3. **Core Controller Modules Covered**:
   - `mosques`: `MosquesController` (`POST /mosques`, `GET /mosques/nearby`, `POST /mosques/check-duplicate`, `GET /mosques/:id`, `GET /mosques`)
   - `facilities`: `FacilitiesController` (`GET /mosques/:id/facilities`, `PUT /mosques/:id/facilities`)
   - `announcements`: `AnnouncementsController` (`GET /announcements/feed`, `POST /announcements/mosques/:id`, `PATCH /announcements/:id`, `DELETE /announcements/:id`)
   - `donations`: `DonationsController` (`POST /mosques/:id/donations`, `GET /donations/:id`, `PATCH /donations/:id/verify`, `PATCH /donations/:id/reject`, `POST /donations/:id/report`)
   - `community`: `CommunityController` (`GET /community/mosques/:id/events`, `POST /community/mosques/:id/events`, `GET /community/mosques/:id/qa`, `POST /community/mosques/:id/qa`, `POST /community/qa/:id/answers`)
   - `suggestions`: `SuggestionsController` (`POST /suggestions/mosques/:id`, `GET /suggestions/mosques/:id`, `PATCH /suggestions/:id`)
   - `prayer-schedules`: `PrayerSchedulesController` (`GET /prayer-schedules/mosques/:id`, `PUT /prayer-schedules/mosques/:id`, `POST /prayer-schedules/mosques/:id/rollback`)
   - `mosque-verification`: `MosqueVerificationController` (`POST /mosques/:id/verification-requests`, `GET /mosque-verification/admin/pending`, `PATCH /mosque-verification/admin/:id`)
   - `notifications`: `NotificationsController` (`GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `POST /notifications/mosques/:id/follow`, `DELETE /notifications/mosques/:id/follow`)
   - `attendance`: `AttendanceController` (`POST /attendance/mosques/:id/toggle`, `GET /attendance/mosques/:id/today`)
   - `operations-health`: `OperationsHealthController` (`GET /health/live`, `GET /health/ready`, `GET /admin/operations/health`)

---

## 2. Implementation Slices & Proof of Completion

### TK-TEST-01: Module Test Folder Directory Migration
- **Status**: completed
- **Priority**: High
- **Description**: Relocate all existing feature service spec files from root feature folders to `src/features/<feature>/test/` and update relative import paths.
- **Acceptance Criteria**:
  - [x] All `*.service.spec.ts` files moved to `src/features/<module>/test/`
  - [x] Relative imports inside moved specs updated to reference `../<module>.service`
  - [x] `pnpm test` runs all moved suites and passes without failures

### TK-TEST-02: Mosques & Facilities Controller Unit Tests
- **Status**: completed
- **Priority**: High
- **Description**: Author comprehensive unit tests in `src/features/mosques/test/mosques.controller.spec.ts` and `src/features/facilities/test/facilities.controller.spec.ts`.
- **Acceptance Criteria**:
  - [x] `MosquesController` tests cover creation, nearby search, duplicate check, retrieval, listing
  - [x] `FacilitiesController` tests cover retrieval and upsert with role authorization
  - [x] Tests verify mock service invocations and parameter mapping

### TK-TEST-03: Announcements & Donations Controller Unit Tests
- **Status**: completed
- **Priority**: High
- **Description**: Author unit tests for `AnnouncementsController` and `DonationsController`.
- **Acceptance Criteria**:
  - [x] `AnnouncementsController` tests cover feed query, post creation, update, and deletion
  - [x] `DonationsController` tests cover donation record creation, two-person verification, rejection, and fraud reporting

### TK-TEST-04: Community, Suggestions & Prayer Schedules Controller Unit Tests
- **Status**: completed
- **Priority**: High
- **Description**: Author unit tests for `CommunityController`, `SuggestionsController`, and `PrayerSchedulesController`.
- **Acceptance Criteria**:
  - [x] `CommunityController` tests cover events list/create and Q&A list/ask/answer
  - [x] `SuggestionsController` tests cover suggestion submission, review, and status transitions
  - [x] `PrayerSchedulesController` tests cover retrieval, atomic update, and history rollback

### TK-TEST-05: Verification, Notifications & Attendance Controller Unit Tests
- **Status**: completed
- **Priority**: High
- **Description**: Author unit tests for `MosqueVerificationController`, `NotificationsController`, `AttendanceController`, and `OperationsHealthController`.
- **Acceptance Criteria**:
  - [x] `MosqueVerificationController` tests cover verification request submission, pending queue, and approval/rejection
  - [x] `NotificationsController` tests cover list retrieval, mark-as-read, read-all, and follow/unfollow
  - [x] `AttendanceController` tests cover daily attendance toggle and aggregate count retrieval
  - [x] `OperationsHealthController` tests cover liveness, readiness, and detailed health diagnostic endpoints
  - [x] Full `pnpm test` execution reports 100% pass across all 37 test suites (207 tests)
