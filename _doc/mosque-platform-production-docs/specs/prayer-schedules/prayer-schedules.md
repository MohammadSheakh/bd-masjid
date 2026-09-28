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

## 6. Associated Tickets
- [TK-PRAY-01: Prayer Schedule Schema & History](tickets/TK-PRAY-01-schema-and-history.md)
- [TK-PRAY-02: Atomic Update & Rollback Service API](tickets/TK-PRAY-02-atomic-update-api.md)
- [TK-PRAY-03: Live Prayer Countdown & Display Banner](tickets/TK-PRAY-03-live-countdown-banner.md)
