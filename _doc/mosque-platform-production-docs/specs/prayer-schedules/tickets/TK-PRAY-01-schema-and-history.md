# TK-PRAY-01: Prayer Schedule Schema & History Tracking

## Spec
Parent Spec: [prayer-schedules.md](../prayer-schedules.md)

## Status
**Completed** `[x]`

## Priority
Critical

---

## Description
Design the relational database models for `PrayerSchedule` and `PrayerScheduleHistory`, supporting separate start and Jamaat columns, seasonal prayer entries, and JSON snapshots.

## Acceptance Criteria
- [x] Model `PrayerSchedule` created with one-to-one relation to `Mosque` (via `mosqueId @unique`).
- [x] Start and Jamaat fields for Fajr, Zuhr, Asr, Maghrib, Isha, Jumuah, Taraweeh.
- [x] Model `PrayerScheduleHistory` created with `scheduleSnapshot Json` and `changedById`.
- [x] Cascade delete on mosque deletion; SetNull on user deletion.
- [x] Indexes on `mosqueId` and `updatedAt`.

## Implementation Files
- Schema: `backend-nest-prisma/prisma/schema.prisma`
