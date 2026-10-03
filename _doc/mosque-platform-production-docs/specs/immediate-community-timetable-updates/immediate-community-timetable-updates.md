---
id: F-034
name: Immediate Community Prayer Timetable Updates
phase: 3
status: completed

depends_on:
  - F-001
  - F-004
  - F-006
  - F-007
  - F-033

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#prayer-and-jamaat-information
  - 02-SYSTEM-ARCHITECTURE.md#sovereign-mosque-registry
  - 03-DATA-API-CONTRACTS.md#prayer-schedule-contracts
  - 06-IMPLEMENTATION-CHECKLIST.md#h-prayer-schedules
  - 08-PRODUCTION-ENGINEERING-STANDARD.md#definition-of-done
---

# Feature Specification: Immediate Community Prayer Timetable Updates

## 1. Overview
This specification eliminates the manual administrative approval bottleneck for mosque prayer schedule updates. Timetable changes submitted by community members take immediate effect on the active schedule and are logged to immutable history records:
1. **Immediate Community Updates**: Any community member or visitor can update congregational Jamaat times directly without waiting for admin approval.
2. **Atomic Versioned History**: Every modification executes in a single database transaction (`prisma.$transaction`), simultaneously updating `PrayerSchedule` and recording an immutable snapshot in `PrayerScheduleHistory`.
3. **No Bureaucratic Delay**: Musallis always see the most up-to-date committee timings for Fajr, Zuhr, Asr, Maghrib, Isha, and Jumu'ah.
4. **Scope Exclusions**: In accordance with platform governance, volunteer roster coordination, multi-jamat shifts, special Jumu'ah matrices, and Ramadan schedules/timetables are excluded.
5. **Abuse Protection & Auditability**: Protected by sliding-window rate limiting, strict 24-hour time format validation (`HH:mm`), and audit logging. Community members can flag inaccuracies via issue reports.

---

## 2. Business Invariants
1. **Direct Persistence Invariant**:
   - Updates submitted to `PUT /api/v1/mosques/:id/prayer-schedule` persist immediately to the database without administrative staging or gatekeeping.
2. **Atomic History Logging**:
   - `PrayerSchedule` mutation and `PrayerScheduleHistory` snapshot creation MUST occur in the same database transaction.
   - `changedById` is captured when an authenticated user performs the edit; anonymous edits are recorded with `changedById: null` and client metadata.
3. **Strict Time Validation**:
   - Times must conform to 24-hour military clock string format (`^([01]\d|2[03]):[0-5]\d$`).
4. **Freshness Invariant**:
   - Every timetable update resets the mosque's schedule freshness to `FRESH` and touches `mosque.updatedAt`.
5. **Decommissioned Approval Queue**:
   - The admin manual schedule review queue is decommissioned; suggestions submitted via legacy endpoints are automatically applied.

---

## 3. REST API Contracts

### `PUT /api/v1/mosques/:id/prayer-schedule`
- **Access**: Public / Community (rate-limited via `SlidingWindowRateLimitGuard`)
- **Body**: `UpdatePrayerScheduleDto` (JSON with optional prayer times and optional reason)
- **Response**: `200 OK` with updated `PrayerSchedule` and freshness indicator

### `GET /api/v1/mosques/:id/prayer-schedule/history`
- **Access**: Public
- **Response**: `200 OK` with paginated `PrayerScheduleHistory` snapshots

---

## 4. Implementation Checklist
- [x] Author ADR-021 and Feature Specification F-034
- [x] Backend: Remove RBAC restriction from `PrayerSchedulesService.updateSchedule`
- [x] Backend: Ensure backward compatibility in `SuggestionsService.createSuggestion` to auto-apply timetable updates
- [x] Backend: Update unit and controller tests
- [x] Frontend: Update `SuggestionModal.tsx` to "Update Prayer Timetable" and call direct update API
- [x] Frontend: Remove green Ramadan timetable section from `SuggestionModal.tsx`
- [x] Frontend: Update `admin/page.tsx` to reflect decommissioned suggestion approval queue
- [x] Verify full test suite passing and zero type errors
