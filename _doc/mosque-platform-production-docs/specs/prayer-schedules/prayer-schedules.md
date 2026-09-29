---
id: F-007
name: Prayer Schedules & Historical Auditing
phase: 1
status: completed

depends_on:
  - F-001
  - F-004

blocks:
  - F-008
  - F-009

parallel_with:
  - F-005

source:
  - 01-PRD-PRODUCTION.md#prayer-and-jamaat-information
  - 03-DATA-API-CONTRACTS.md#prayer-schedule-contracts
  - 06-IMPLEMENTATION-CHECKLIST.md#h-prayer-schedules
---

# Feature Specification: Prayer Schedules & Historical Auditing

## 1. Overview
The Prayer Schedule feature maintains congregational Jamaat times and start times for each mosque, offering live prayer countdowns, atomic history recording on edits, and freshness tracking.

## 2. Business Invariants
1. **Explicit Separation of Start and Jamaat**: Prayer start time (waqt start) and congregational Jamaat time are stored independently.
2. **Strict Time Format**: All times must conform to 24-hour military clock string format (`HH:mm`, regex `^([01]\d|2[03]):[0-5]\d$`).
3. **Atomic Current + History Mutation**: Updating a mosque's prayer schedule must be wrapped in a database transaction that simultaneously mutates `PrayerSchedule` and inserts an immutable record into `PrayerScheduleHistory`.
4. **Timezone Anchor**: Defaults to `Asia/Dhaka` to eliminate day-boundary edge case anomalies.
5. **Freshness Invariant**: If a schedule has not been updated within 60 days, it is classified as potentially stale.

## 3. Data Models Reference
- `PrayerSchedule`: `mosqueId` (unique), `fajrStart`, `fajrJamaat`, `zuhrStart`, `zuhrJamaat`, `asrStart`, `asrJamaat`, `maghribStart`, `maghribJamaat`, `ishaStart`, `ishaJamaat`, `jumuahJamaat`, `jumuahSecondJamaat`, `taraweehJamaat`, `sahriEnd`, `iftarStart`, `timezone`, `updatedById`, `updatedAt`.
- `PrayerScheduleHistory`: `mosqueId`, `scheduleSnapshot` (Json), `changedById`, `reason`, `createdAt`.

## 4. REST API Contracts
- `GET /api/v1/prayer-schedules/:mosqueId` — Get active schedule and freshness
- `PUT /api/v1/prayer-schedules/:mosqueId` — Atomically update prayer schedule (requires authenticated staff/moderator/admin)
- `GET /api/v1/prayer-schedules/:mosqueId/history` — Get historical update audit log

## 5. Extracted Implementation Checklist
- [x] Prayer start and Jamaat times stored separately in schema
- [x] Timezone semantics explicitly defaulted to `Asia/Dhaka`
- [x] Public read endpoint (`GET /api/v1/prayer-schedules/:mosqueId`)
- [x] Authorized mutation endpoint (`PUT /api/v1/prayer-schedules/:mosqueId`)
- [x] Current + history atomic update wrapped in `prisma.$transaction`
- [x] `updatedBy` and `updatedAt` tracking
- [x] Strict time format regex validation (`^([01]\d|2[03]):[0-5]\d$`)
- [x] Freshness status derived based on timestamp
- [x] Rollback and concurrency unit tests (`prayer-schedules.service.spec.ts`)
- [x] Frontend Next Prayer Live Countdown Banner

---

## 6. Implementation Slices & Proof of Completion

### TK-PRAY-01: Prayer Schedule Schema & History Tracking
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Design the relational database models for `PrayerSchedule` and `PrayerScheduleHistory`, supporting separate start and Jamaat columns, seasonal prayer entries, and JSON snapshots.
- **Acceptance Criteria**:
  - [x] Model `PrayerSchedule` created with one-to-one relation to `Mosque` (via `mosqueId @unique`).
  - [x] Start and Jamaat fields for Fajr, Zuhr, Asr, Maghrib, Isha, Jumuah, Taraweeh.
  - [x] Model `PrayerScheduleHistory` created with `scheduleSnapshot Json` and `changedById`.
  - [x] Cascade delete on mosque deletion; SetNull on user deletion.
  - [x] Indexes on `mosqueId` and `updatedAt`.
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema.prisma`

### TK-PRAY-02: Atomic Update & Rollback Service API
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Implement the transactional update service that persists modifications to active prayer schedules and simultaneously writes historical audit records within an atomic database transaction.
- **Acceptance Criteria**:
  - [x] Endpoint `PUT /api/v1/prayer-schedules/:mosqueId` accepts validated `UpdatePrayerScheduleDto`.
  - [x] Input times validated against 24h format regex `^([01]\d|2[03]):[0-5]\d$`.
  - [x] Service executes `prisma.$transaction` creating history snapshot.
  - [x] Reverts entirely if history record fails to insert.
  - [x] Unit tests cover successful updates and transaction rollback (`prayer-schedules.service.spec.ts`).
- **Implementation Files**:
  - DTO: `backend-nest-prisma/src/features/prayer-schedules/dto/update-prayer-schedule.dto.ts`
  - Service: `backend-nest-prisma/src/features/prayer-schedules/prayer-schedules.service.ts`
  - Controller: `backend-nest-prisma/src/features/prayer-schedules/prayer-schedules.controller.ts`
  - Tests: `backend-nest-prisma/src/features/prayer-schedules/prayer-schedules.service.spec.ts`

### TK-PRAY-03: Live Prayer Countdown & Display Banner
- **Status**: `[x] Completed` | **Priority**: High
- **Description**: Develop the live countdown timer banner and prayer schedule presentation on the frontend, displaying the current prayer window and exact countdown time to the next Jamaat.
- **Acceptance Criteria**:
  - [x] Component `PrayerCountdownBanner.tsx` embedded at top of home view.
  - [x] Calculates nearest upcoming prayer based on local/Asia:Dhaka time.
  - [x] Displays active prayer name, next Jamaat time, and live ticking countdown (hh:mm:ss).
  - [x] Mosque profile modals and pages display tabular view of all 5 daily prayers + Jumuah.
  - [x] Highlights current prayer dynamically.
- **Implementation Files**:
  - Component: `frontend/src/components/PrayerCountdownBanner.tsx`
  - Detail Modal: `frontend/src/components/MosqueDetailModal.tsx`
